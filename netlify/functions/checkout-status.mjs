import { json, stripeClient } from '../lib/stripe.mjs';

export default async function checkoutStatus(request) {
  if (request.method !== 'GET') return json({ error: 'Méthode non autorisée.' }, 405, { Allow: 'GET' });
  const sessionId = new URL(request.url).searchParams.get('session_id');
  if (!sessionId || !/^cs_(test_|live_)?[a-zA-Z0-9]{16,200}$/.test(sessionId)) {
    return json({ error: 'Identifiant de paiement invalide.' }, 400);
  }
  const stripe = stripeClient();
  if (!stripe) return json({ error: 'La vérification du paiement est indisponible.' }, 503);
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.integration !== 'pokemarket-checkout') {
      return json({ error: 'Paiement introuvable.' }, 404);
    }
    return json({ paid: session.payment_status === 'paid', status: session.status });
  } catch {
    return json({ error: 'Impossible de vérifier ce paiement. Contactez la boutique en cas de débit.' }, 502);
  }
}
