import { Router } from "express";
import customersController from "../controllers/customersController.js";

const customersRouter = Router();

customersRouter.get("/", customersController.getCustomers);

export default customersRouter;