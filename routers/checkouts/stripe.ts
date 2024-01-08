import { Router } from "express";
import {
  createCheckoutSession,
  createPaymentIntent
} from "../../controllers/checkouts/stripe";
// import { adminOnly } from "../middlewares/authHandler";

const router = Router();

router.route("/create-session").post(createCheckoutSession);
router.route("/payment-intent").post(createPaymentIntent);

export default router;
