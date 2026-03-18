const Stripe = require('stripe');
const { createClerkClient } = require('@clerk/backend');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  const chunks = [];
  await new Promise((resolve, reject) => {
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', resolve);
    req.on('error', reject);
  });
  const rawBody = Buffer.concat(chunks);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  const session = event.data.object;

  if (event.type === 'checkout.session.completed') {
    const userId = session.metadata?.userId;
    if (userId) {
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { subscribed: true },
      });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const userId = session.metadata?.userId;
    if (userId) {
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: { subscribed: false },
      });
    }
  }

  res.status(200).json({ received: true });
}
