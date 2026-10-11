import { getDatabase } from '@netlify/database';
import { json } from '../lib/client-http.mjs';

export default async function productStock(request) {
  if (request.method !== 'GET') {
    return json({ error: 'Méthode non autorisée.' }, 405, { Allow: 'GET' });
  }
  try {
    const db = getDatabase();
    const stocks = await db.sql`
      SELECT product_name AS name, quantity FROM product_stock ORDER BY product_name
    `;
    return json({ stocks });
  } catch {
    return json({ error: 'Les stocks sont indisponibles pour le moment.' }, 503);
  }
}
