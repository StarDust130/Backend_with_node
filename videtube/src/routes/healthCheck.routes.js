import { Router } from "express";
import { healthCheckController } from "../controllers/healthCheck.controller.js";

const router = Router();

router.route("/").get(healthCheckController);

export default router;

