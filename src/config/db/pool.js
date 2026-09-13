import "dotenv/config";
import { Pool } from "pg";

const isProduction = process.env.NODE_ENV === "production";

export default new Pool({
    connectionString: isProduction ? process.env.DB_PROD : process.env.DB_DEV,
    ssl: isProduction ? { rejectUnauthorized: false } : false
});