import { getDatabase } from '@netlify/database';
import { requireAdmin } from '../lib/admin-auth.mjs';
import { json, readBody } from '../lib/client-http.mjs';
import { products } from '../lib/products.mjs';

export default async function adminStock(request) {
  if (!['GET', 'PUT'].includes(request.method)) {
    return json({ error: 'Méthode non autorisée.' }, 405, { Allow: 'GET, PUT' });
  }
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const catalog = products();
  try {
    const db = getDatabase();
    if (request.method === 'PUT') {
      let body;
      try {
        body = await readBody(request);
      } catch {
        return json({ error: 'Requête invalide.' }, 400);
      }
      if (typeof body.name !== 'string' || !catalog.has(body.name)) {
        return json({ error: 'Produit inconnu.' }, 400);
      }
      if (!Number.isInteger(body.quantity) || body.quantity < 0 || body.quantity > 100000) {
        return json({ error: 'La quantité doit être un entier entre 0 et 100 000.' }, 400);
      }
      await db.sql`
        INSERT INTO product_stock (product_name, quantity) VALUES (${body.name}, ${body.quantity})
        ON CONFLICT (product_name) DO UPDATE SET quantity = EXCLUDED.quantity
      `;
    }
    const rows = await db.sql`SELECT product_name AS name, quantity FROM product_stock`;
    const stock = new Map(rows.map(row => [row.name, row.quantity]));
    const items = [...catalog].map(([name, price]) => ({
      name, price, quantity: stock.has(name) ? stock.get(name) : null
    }));
    return json({ items });
  } catch {
    return json({ error: 'Les stocks sont indisponibles pour le moment.' }, 503);
  }
}
