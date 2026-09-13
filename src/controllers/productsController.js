import db from "../config/db/queries.js";

const getProducts = async (req, res, next) => {

    try {
        const products = await db.getAllProducts();
        res.status(200).json({
            count: products.length,
            products
        });
    } catch (err) {
        next(err);
    }
};

const getProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await db.getProductById(id);

        if (!product) return res.status(404).json({ error: "Product not found" });

        res.status(200).json({ product });
    } catch (err) {
        next(err);
    }
};

const createProduct = async (req, res, next) => {
    try {
        const { product_name, product_unit, product_price, product_quantity, low_stock_threshold } = req.body;

        if (!product_name || !product_unit || product_price == null || product_quantity == null) {
            return res.status(400).json({
                error: "product_name, product_unit, product_price and product_quantity are required",
            });
        }

        const product = await db.createProduct(
            product_name,
            product_unit,
            product_price,
            product_quantity,
            low_stock_threshold ?? 5
        );

        res.status(201).json({ product });
    } catch (err) {
        if (err.code === "23505") {
            return res.status(409).json({ error: "A product with that name already exists" });
        }
        next(err);
    }
};

const editProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { product_name, product_unit, product_price, product_quantity, low_stock_threshold } = req.body;

        const existing = await db.getProductById(id);
        if (!existing) return res.status(404).json({ error: "Product not found" });

        if (!product_name || !product_unit || product_price == null || product_quantity == null) {
            return res.status(400).json({
                error: "product_name, product_unit, product_price and product_quantity are required",
            });
        }

        const updated = await db.updateProduct(
            id,
            product_name,
            product_unit,
            product_price,
            product_quantity,
            low_stock_threshold ?? existing.low_stock_threshold
        );

        res.status(200).json({ product: updated });
    } catch (err) {
        if (err.code === "23505") {
            return res.status(409).json({ error: "A product with that name already exists" });
        }
        next(err);
    }
};

export default {
    getProducts,
    getProduct,
    createProduct,
    editProduct
}