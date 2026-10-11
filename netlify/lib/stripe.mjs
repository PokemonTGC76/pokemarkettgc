import Stripe from 'stripe';

export function environment(name) {
  return globalThis.Netlify?.env?.get(name) || process.env[name];
}

export function stripeClient() {
  const secret = environment('STRIPE_SECRET_KEY') || environment('STRIP_SECRET_KEY');
  if (!secret) return null;
  return new Stripe(secret, { maxNetworkRetries: 2, timeout: 15000 });
}

export function siteOrigin(request) {
  return new URL(environment('URL') || request.url).origin;
}

export function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}
