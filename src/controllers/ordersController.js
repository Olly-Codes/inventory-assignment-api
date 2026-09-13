import db from "../config/db/queries.js";

const getOrders = async (req, res, next) => {

    try {
        const orders = await db.getAllOrders();
        res.status(200).json({
            count: orders.length,
            orders
        });
    } catch (err) {
        next(err);
    }
};

const getOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await db.getOrderById(id);

        if (!order) return res.status(404).json({ error: "Order not found" });

        res.status(200).json({ order });
    } catch (err) {
        next(err);
    }
};

const getPendingOrders = async (req, res, next) => {
    try {
        const orders = await db.getPendingOrders();
        res.status(200).json({ count: orders.length, orders });
    } catch (err) {
        next(err);
    }
};

const confirmOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await db.getOrderById(id);

        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.order_status !== "pending") {
            return res.status(400).json({ error: `Order is not pending (status: ${order.order_status})` });
        }

        const product = await db.getProductById(order.product_id);
        if (product.product_quantity < order.order_quantity) {
            return res.status(400).json({ error: "Not enough stock to confirm this order" });
        }

        const updatedProduct = await db.updateProductStock(
            product.product_id,
            product.product_quantity - order.order_quantity
        );
        const updatedOrder = await db.updateOrderStatus(id, "confirmed");
        const lowStockTriggered = updatedProduct.product_quantity <= updatedProduct.low_stock_threshold;

        res.status(200).json({ order: updatedOrder, product: updatedProduct, lowStockTriggered });
    } catch (err) {
        next(err);
    }
};

const cancelOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await db.getOrderById(id);

        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.order_status !== "pending") {
            return res.status(400).json({ error: `Order is not pending (status: ${order.order_status})` });
        }

        const updatedOrder = await db.updateOrderStatus(id, "cancelled");
        res.status(200).json({ order: updatedOrder });
    } catch (err) {
        next(err);
    }
};

export default {
    getOrders,
    getOrder,
    getPendingOrders,
    confirmOrder,
    cancelOrder
}