import { requireAdmin } from '../lib/admin-auth.mjs';
import { json } from '../lib/client-http.mjs';
import { stripeClient } from '../lib/stripe.mjs';

export default async function adminOrders(request) {
  if (request.method !== 'GET') {
    return json({ error: 'Méthode non autorisée.' }, 405, { Allow: 'GET' });
  }
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const stripe = stripeClient();
  if (!stripe) return json({ error: 'Stripe n’est pas configuré sur ce site.' }, 503);
  const after = new URL(request.url).searchParams.get('after');
  if (after && !/^cs_(test_|live_)?[a-zA-Z0-9]{16,200}$/.test(after)) {
    return json({ error: 'Pagination invalide.' }, 400);
  }
  try {
    const page = await stripe.checkout.sessions.list({
      limit: 25,
      expand: ['data.line_items'],
      ...(after ? { starting_after: after } : {})
    });
    const orders = page.data
      .filter(session => session.metadata?.integration === 'pokemarket-checkout')
      .map(session => {
        const shipping = session.collected_information?.shipping_details || session.shipping_details;
        const address = shipping?.address;
        return {
          id: session.id,
          created: session.created,
          amount: session.amount_total,
          currency: session.currency,
          paymentStatus: session.payment_status,
          status: session.status,
          name: shipping?.name || session.customer_details?.name || '',
          email: session.customer_details?.email || '',
          address: address
            ? [address.line1, address.line2, [address.postal_code, address.city].filter(Boolean).join(' '), address.country]
              .filter(Boolean).join(', ')
            : '',
          items: (session.line_items?.data || []).map(item => ({ name: item.description, quantity: item.quantity }))
        };
      });
    return json({ orders, next: page.has_more ? page.data.at(-1).id : null });
  } catch {
    return json({ error: 'Stripe ne répond pas pour le moment. Réessayez plus tard.' }, 502);
  }
}
