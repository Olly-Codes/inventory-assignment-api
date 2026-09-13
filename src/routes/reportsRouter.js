import { Router } from "express";
import reportsController from "../controllers/reportsController.js";

const reportsRouter = Router();

reportsRouter.post("/generate", reportsController.generateReport);

export default reportsRouter;