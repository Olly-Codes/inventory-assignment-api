import pool from './pool.js';

const getAllProducts = async () => {
    const { rows } = await pool.query(`
        SELECT *
        FROM products
        ORDER BY product_name;
        `);
    return rows;
};

const getAllCustomers = async () => {
    const { rows } = await pool.query(`
        SELECT *
        FROM customers
        ORDER BY customer_name;
        `);
    return rows;
};

const getAllOrders = async () => {
    const { rows } = await pool.query(`
        SELECT
            orders.order_id,
            orders.order_quantity,
            orders.order_status,
            orders.created_at,
            products.product_name,
            products.product_unit,
            customers.customer_name,
            customers.customer_contact
        FROM orders
        JOIN products ON products.product_id = orders.product_id
        JOIN customers ON customers.customer_id = orders.customer_id
        ORDER BY orders.created_at DESC;
        `);
    return rows;
};

const getLowStockProducts = async () => {
    const { rows } = await pool.query(`
        SELECT *
        FROM products
        WHERE product_quantity <= low_stock_threshold
        ORDER BY product_quantity ASC;
        `);
    return rows;
};

const getConfirmedOrdersLast24h = async () => {
    const { rows } = await pool.query(`
        SELECT
            orders.order_id,
            orders.order_quantity,
            orders.created_at,
            products.product_name,
            products.product_price
        FROM orders
        JOIN products ON products.product_id = orders.product_id
        WHERE orders.order_status = 'confirmed'
          AND orders.created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY orders.created_at DESC;
        `);
    return rows;
};

const getPendingOrders = async () => {
    const { rows } = await pool.query(`
        SELECT
            orders.order_id,
            orders.order_quantity,
            orders.created_at,
            products.product_name,
            customers.customer_name,
            customers.customer_contact
        FROM orders
        JOIN products ON products.product_id = orders.product_id
        JOIN customers ON customers.customer_id = orders.customer_id
        WHERE orders.order_status = 'pending'
        ORDER BY orders.created_at ASC;
        `);
    return rows;
};

const getOrderById = async (orderId) => {
    const { rows } = await pool.query(
        `
        SELECT
            orders.order_id,
            orders.product_id,
            orders.customer_id,
            orders.order_quantity,
            orders.order_status,
            orders.created_at
        FROM orders
        WHERE orders.order_id = $1;
        `,
        [orderId]
    );
    return rows[0];
};

const getProductById = async (productId) => {
    const { rows } = await pool.query(
        `
        SELECT *
        FROM products
        WHERE product_id = $1;
        `,
        [productId]
    );
    return rows[0];
};

const updateOrderStatus = async (orderId, status) => {
    const { rows } = await pool.query(
        `
        UPDATE orders
        SET order_status = $1
        WHERE order_id = $2
        RETURNING *;
        `,
        [status, orderId]
    );
    return rows[0];
};

const updateProductStock = async (productId, newQuantity) => {
    const { rows } = await pool.query(
        `
        UPDATE products
        SET product_quantity = $1
        WHERE product_id = $2
        RETURNING *;
        `,
        [newQuantity, productId]
    );
    return rows[0];
};

const createProduct = async (productName, productUnit, productPrice, productQuantity, lowStockThreshold) => {
    const { rows } = await pool.query(
        `
        INSERT INTO products (product_name, product_unit, product_price, product_quantity, low_stock_threshold)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
        `,
        [productName, productUnit, productPrice, productQuantity, lowStockThreshold]
    );
    return rows[0];
};

const getConfirmedOrdersSince = async (days) => {
    const { rows } = await pool.query(
        `
        SELECT
            orders.order_id,
            orders.order_quantity,
            orders.created_at,
            products.product_name,
            products.product_price
        FROM orders
        JOIN products ON products.product_id = orders.product_id
        WHERE orders.order_status = 'confirmed'
          AND orders.created_at >= NOW() - ($1 * INTERVAL '1 day')
        ORDER BY orders.created_at DESC;
        `,
        [days]
    );
    return rows;
};

const getCancelledOrderCountSince = async (days) => {
    const { rows } = await pool.query(
        `
        SELECT COUNT(*)::int AS cancelled_count
        FROM orders
        WHERE order_status = 'cancelled'
          AND created_at >= NOW() - ($1 * INTERVAL '1 day');
        `,
        [days]
    );
    return rows[0].cancelled_count;
};

const getDeadStockProducts = async (days) => {
    const { rows } = await pool.query(
        `
        SELECT *
        FROM products
        WHERE product_id NOT IN (
            SELECT DISTINCT product_id
            FROM orders
            WHERE order_status = 'confirmed'
              AND created_at >= NOW() - ($1 * INTERVAL '1 day')
        )
        ORDER BY product_name;
        `,
        [days]
    );
    return rows;
};

const updateProduct = async (productId, productName, productUnit, productPrice, productQuantity, lowStockThreshold) => {
    const { rows } = await pool.query(
        `
        UPDATE products
        SET product_name = $1,
            product_unit = $2,
            product_price = $3,
            product_quantity = $4,
            low_stock_threshold = $5
        WHERE product_id = $6
        RETURNING *;
        `,
        [productName, productUnit, productPrice, productQuantity, lowStockThreshold, productId]
    );
    return rows[0];
};

export default {
    getAllProducts,
    getAllCustomers,
    getAllOrders,
    getLowStockProducts,
    getConfirmedOrdersLast24h,
    getPendingOrders,
    getOrderById,
    getProductById,
    updateOrderStatus,
    updateProductStock,
    createProduct,
    getConfirmedOrdersSince,
    getCancelledOrderCountSince,
    getDeadStockProducts,
    updateProduct
};