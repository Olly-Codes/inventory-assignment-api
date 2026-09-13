import "dotenv/config";
import express from "express";
import cors from "cors";

import indexRouter from "./routes/indexRouter.js";
import ordersRouter from "./routes/ordersRouter.js";
import reportsRouter from "./routes/reportsRouter.js";
import productsRouter from "./routes/productsRouter.js";
import customersRouter from "./routes/customersRouter.js";


const app = express();
const allowedOrigins = [
    "http://localhost:5173",
    process.env.ADMIN_CLIENT_URL
];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    }
}));

app.use("/", indexRouter);
app.use("/orders", ordersRouter);
app.use("/reports", reportsRouter);
app.use("/products", productsRouter);
app.use("/customers", customersRouter);


app.use((req, res, next) => {
    const err = new Error("That route does not exist");
    err.statusCode = 404;
    next(err);
});

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    const errorMessage = statusCode === 500 ?
    "Something went wrong on our end!" : err.message;

    if (process.env.NODE_ENV !== "production") {
        console.error(err.stack);
    }

    res.status(statusCode).json(
        {
            error: errorMessage
        }
    );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
    if (err) {
        throw err;
    }
    console.log(`Listening on port - ${PORT}`);
});