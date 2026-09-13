import { Router } from "express";
import productsController from "../controllers/productsController.js";

const productsRouter = Router();

productsRouter.get("/", productsController.getProducts);
productsRouter.get("/:id", productsController.getProduct);
productsRouter.post("/", productsController.createProduct);
productsRouter.patch("/:id", productsController.editProduct);

export default productsRouter;