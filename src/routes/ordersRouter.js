import { Router } from "express";
import ordersController from "../controllers/ordersController.js";

const ordersRouter = Router();

ordersRouter.get("/", ordersController.getOrders);
ordersRouter.get("/pending", ordersController.getPendingOrders);
ordersRouter.get("/:id", ordersController.getOrder);
ordersRouter.patch("/:id/confirm", ordersController.confirmOrder);
ordersRouter.patch("/:id/cancel", ordersController.cancelOrder);

export default ordersRouter;