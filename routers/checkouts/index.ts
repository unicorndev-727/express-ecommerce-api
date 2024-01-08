import { Router } from "express";
import stripeRouter from "./stripe";
// import { adminOnly } from "../middlewares/authHandler";

const router = Router();

router.use('stripe', stripeRouter)

export default router;
