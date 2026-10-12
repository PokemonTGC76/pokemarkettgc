import { getDatabase } from '@netlify/database';
import { requireAdmin } from '../lib/admin-auth.mjs';
import { json } from '../lib/client-http.mjs';

export default async function adminClients(request) {
  if (request.method !== 'GET') {
    return json({ error: 'Méthode non autorisée.' }, 405, { Allow: 'GET' });
  }
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const db = getDatabase();
    const clients = await db.sql`
      SELECT prenom, nom, email, tel, adresse, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM client_profiles ORDER BY created_at DESC LIMIT 1000
    `;
    return json({ clients });
  } catch {
    return json({ error: 'La liste des clients est indisponible pour le moment.' }, 503);
  }
}
