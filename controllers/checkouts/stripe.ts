import Stripe from "stripe";
import asyncHandler from "../../middlewares/asyncHandler";
const stripe = new Stripe(process.env.STRIPE_SK ?? `sk_test_51OV9Y3JK3kE2AXhzAMK4ShXmL8GaemMW7EYHKyTJUaZ9SUYFccKJzAJYtub5b8aK4fT0ldZ4JgqUFVBrozNh2jrX007JN2ZWC3`);

const MY_DOMAIN = process.env.FRONTEND ?? 'http://localhost:3000';

/**
 * Create a checkout session
 * @route   POST /api/v1/checkout/stripe/session
 */
export const createCheckoutSession = asyncHandler(async (req, res, next) => {
    const session = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        line_items: [
            {
                // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                price: '{{PRICE_ID}}',
                quantity: 1,
            },
        ],
        mode: 'payment',
        return_url: `${MY_DOMAIN}/checkout?session_id={CHECKOUT_SESSION_ID}`,
    });

    res.send({ clientSecret: session.client_secret });
});

/**
 * Get a session status
 * @route   POST /api/v1/checkout/stripe/session-status
 */
export const getSessionStatus = asyncHandler(async (req, res, next) => {
    const { session_id } = req.query;
    const session = await stripe.checkout.sessions.retrieve(typeof session_id === 'string' ? session_id : '');

    res.send({
        status: session.status,
        customer_email: session.customer_details?.email
    });
});

/**
 * Create a payment intent
 * @route   POST /api/v1/checkout/stripe/payment-intent
 */
export const createPaymentIntent = asyncHandler(async (req, res, next) => {
    const { amount, currency } = req.body;
    
    try {
        const intent = await stripe.paymentIntents.create({
            // amount * 100 for cents
            amount: Number(amount) * 100 ?? 0,
            currency: currency ?? 'usd',
            // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.json({ client_secret: intent.client_secret });
    } catch (e) {
        res.json({ error: e })
    }
});

