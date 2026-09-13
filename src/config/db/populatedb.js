import 'dotenv/config';
import { Client } from 'pg';

const SQL = `
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

CREATE TABLE customers (
    customer_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    customer_name VARCHAR(50) NOT NULL,
    customer_contact TEXT NOT NULL
);

CREATE TABLE products (
    product_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    product_name VARCHAR(50) UNIQUE NOT NULL,
    product_unit VARCHAR(50) NOT NULL,
    product_price NUMERIC(10, 2) NOT NULL,
    product_quantity INTEGER NOT NULL,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5
);

CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    product_id INTEGER,
    customer_id INTEGER,
    order_quantity INTEGER NOT NULL CHECK (order_quantity > 0),
    order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status in ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (product_id) REFERENCES products (product_id),
    FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
);

INSERT INTO customers (customer_name, customer_contact)
VALUES
    ('Amanda', '061 754 8908'),
    ('Kevin', '062 621 1278'),
    ('Malusi', '078 861 1122'),
    ('Vuyo', '079 871 0613'),
    ('Naledi', '083 220 4471'),
    ('Sipho', '072 904 1183'),
    ('Thandeka', '084 552 9903'),
    ('Given', '060 317 6642');

INSERT INTO products (product_name, product_unit, product_price, product_quantity, low_stock_threshold)
VALUES
    ('White Bread', 'loaf', 20, 12, 5),
    ('Full Cream Milk 1L', 'carton', 18, 3, 5),
    ('Eggs (6 pack)', 'tray', 15, 21, 8),
    ('Fruit Rings', 'unit', 2, 100, 20),
    ('Cooking Oil 750ml', 'bottle', 26, 2, 4),
    ('Brown Bread', 'loaf', 22, 15, 5),
    ('Rooibos Tea (40 bag)', 'box', 35, 6, 5),
    ('Sugar 2kg', 'bag', 40, 10, 5),
    ('Baked Beans 410g', 'tin', 14, 40, 10);

-- Orders spread across the last ~10 days.
-- Products 7 (Rooibos Tea) and 9 (Baked Beans) are never ordered at all -> true dead stock.
-- Product 6 (Brown Bread) was only ordered 10 days ago -> outside the 7-day report window,
-- so it should ALSO show as dead stock in the report even though it has order history.
INSERT INTO orders (product_id, customer_id, order_quantity, order_status, created_at)
VALUES
    (1, 1, 2, 'confirmed', NOW() - INTERVAL '1 day'),
    (1, 3, 1, 'confirmed', NOW() - INTERVAL '3 days'),
    (2, 5, 1, 'confirmed', NOW() - INTERVAL '2 days'),
    (2, 2, 2, 'pending',   NOW() - INTERVAL '4 hours'),
    (3, 4, 3, 'confirmed', NOW() - INTERVAL '5 days'),
    (3, 6, 2, 'confirmed', NOW() - INTERVAL '6 days'),
    (3, 8, 1, 'pending',   NOW() - INTERVAL '1 hour'),
    (4, 7, 10, 'confirmed', NOW() - INTERVAL '1 day'),
    (4, 8, 15, 'confirmed', NOW() - INTERVAL '4 days'),
    (4, 1, 5, 'confirmed', NOW() - INTERVAL '6 days'),
    (5, 4, 1, 'cancelled', NOW() - INTERVAL '2 days'),
    (6, 2, 3, 'confirmed', NOW() - INTERVAL '10 days'),
    (8, 3, 2, 'confirmed', NOW() - INTERVAL '3 days'),
    (1, 5, 1, 'cancelled', NOW() - INTERVAL '1 day');
`;

(async () => {
    console.log('seeding...');
    const client = new Client({
        connectionString: process.env.DB_DEV,
    });
    await client.connect();
    await client.query(SQL);
    await client.end();
    console.log('done');
})();