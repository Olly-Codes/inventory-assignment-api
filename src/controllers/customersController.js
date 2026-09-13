import db from "../config/db/queries.js";

const getCustomers = async (req, res, next) => {

    try {
        const customers = await db.getAllCustomers();
        res.status(200).json({
            count: customers.length,
            customers
        });
    } catch (err) {
        next(err);
    }
};

export default {
    getCustomers
}