import db from "../config/db/queries.js";
import ai from "../config/ai/gemini.js";
import { REPORT_SYSTEM_PROMPT } from "../config/ai/prompts.js";

const REPORT_WINDOW_DAYS = 7;
const COOLDOWN_MS = 60 * 1000;
let lastGeneratedAt = null;

const reportSchema = {
    type: "object",
    properties: {
        summary: { type: "string" },
        low_stock_items: { type: "array", items: { type: "string" } },
        dead_stock_items: { type: "array", items: { type: "string" } },
    },
    required: ["summary", "low_stock_items", "dead_stock_items"],
};

const buildReportPrompt = (lowStockProducts, confirmedOrders, deadStockProducts, cancelledCount, totalRevenue) => {
    const lowStockLines = lowStockProducts.length
        ? lowStockProducts.map(p => `- ${p.product_name}: ${p.product_quantity} ${p.product_unit}(s) left`).join("\n")
        : "- None";

    const orderLines = confirmedOrders.length
        ? confirmedOrders.map(o => `- ${o.product_name}: qty ${o.order_quantity}`).join("\n")
        : "- No confirmed orders in this period";

    const deadStockLines = deadStockProducts.length
        ? deadStockProducts.map(p => `- ${p.product_name}`).join("\n")
        : "- None";

    return `
REPORT WINDOW: last ${REPORT_WINDOW_DAYS} days

LOW STOCK ITEMS (current):
${lowStockLines}

CONFIRMED ORDERS (last ${REPORT_WINDOW_DAYS} days):
${orderLines}

PRODUCTS WITH NO CONFIRMED ORDERS (last ${REPORT_WINDOW_DAYS} days):
${deadStockLines}

CANCELLED ORDERS (last ${REPORT_WINDOW_DAYS} days): ${cancelledCount}

TOTAL REVENUE (last ${REPORT_WINDOW_DAYS} days): R${totalRevenue.toFixed(2)}
    `.trim();
};

const generateReport = async (req, res, next) => {
    if (lastGeneratedAt && Date.now() - lastGeneratedAt < COOLDOWN_MS) {
        return res.status(429).json({ error: "Report was generated recently. Please wait before generating again." });
    }

    try {
        const lowStockProducts = await db.getLowStockProducts();
        const confirmedOrders = await db.getConfirmedOrdersSince(REPORT_WINDOW_DAYS);
        const deadStockProducts = await db.getDeadStockProducts(REPORT_WINDOW_DAYS);
        const cancelledCount = await db.getCancelledOrderCountSince(REPORT_WINDOW_DAYS);

        const totalRevenue = confirmedOrders.reduce(
            (sum, order) => sum + order.product_price * order.order_quantity,
            0
        );

        const userPrompt = buildReportPrompt(lowStockProducts, confirmedOrders, deadStockProducts, cancelledCount, totalRevenue);

        let response;
        try {
            response = await ai.models.generateContent({
                model: "gemini-3.6-flash",
                contents: userPrompt,
                config: {
                    systemInstruction: REPORT_SYSTEM_PROMPT,
                    temperature: 0.3,
                    responseMimeType: "application/json",
                    responseSchema: reportSchema,
                },
            });
        } catch (aiErr) {
            if (aiErr.message?.includes("UNAVAILABLE") || aiErr.message?.includes("503")) {
                return res.status(503).json({ error: "The reporting model is experiencing high demand. Please try again shortly." });
            }
            next(aiErr);
            return;
        }

        const raw = response.text?.trim();
        if (!raw) {
            return res.status(502).json({ error: "The report could not be generated. Please try again." });
        }

        const parsed = JSON.parse(raw);
        lastGeneratedAt = Date.now();

        res.status(200).json({
            generatedAt: new Date().toISOString(),
            windowDays: REPORT_WINDOW_DAYS,
            summary: parsed.summary,
            lowStockItems: parsed.low_stock_items,
            deadStockItems: parsed.dead_stock_items,
            cancelledCount,
            totalRevenue,
        });
    } catch (err) {
        next(err);
    }
};

export default { generateReport };