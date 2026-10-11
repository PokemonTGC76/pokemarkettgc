import { checkoutItems } from '../lib/products.mjs';
import { json, siteOrigin, stripeClient } from '../lib/stripe.mjs';

export default async function createCheckoutSession(request) {
  if (request.method !== 'POST') {
    return json({ error: 'Méthode non autorisée.' }, 405, { Allow: 'POST' });
  }
  const origin = siteOrigin(request);
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) {
    return json({ error: 'Origine non autorisée.' }, 403);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Requête JSON invalide.' }, 400);
  }
  const headerKey = request.headers.get('idempotency-key');
  const idempotencyKey = body?.idempotencyKey ?? headerKey;
  if (typeof idempotencyKey !== 'string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(idempotencyKey)
    || (headerKey !== null && headerKey !== idempotencyKey)) {
    return json({ error: 'Identifiant de paiement invalide. Réessayez depuis le panier.' }, 400);
  }
  let lineItems;
  try {
    lineItems = checkoutItems(body?.items);
  } catch (error) {
    return json({ error: error instanceof SyntaxError ? 'Requête JSON invalide.' : error.message }, 400);
  }
  const stripe = stripeClient();
  if (!stripe) {
    return json({ error: 'Le paiement n’est pas encore configuré. Veuillez contacter la boutique.' }, 503);
  }
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ['FR'] },
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=cancel`,
      locale: 'fr',
      metadata: { integration: 'pokemarket-checkout' }
    }, { idempotencyKey });
    if (!session.url) return json({ error: 'La page de paiement est indisponible. Réessayez.' }, 502);
    return json({ url: session.url });
  } catch {
    return json({ error: 'Stripe ne peut pas ouvrir le paiement pour le moment. Réessayez ou contactez la boutique.' }, 502);
  }
}
