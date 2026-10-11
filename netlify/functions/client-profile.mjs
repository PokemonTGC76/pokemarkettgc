import { getDatabase } from '@netlify/database';
import { AuthError, getUser, refreshSession, verifyRequestOrigin } from '@netlify/identity';
import { json, readBody, validEmail } from '../lib/client-http.mjs';

export default async function clientProfile(request) {
  if (!['GET', 'PUT', 'DELETE'].includes(request.method)) {
    return json({ error: 'Méthode non autorisée.' }, 405, { Allow: 'GET, PUT, DELETE' });
  }
  try {
    if (request.method !== 'GET') verifyRequestOrigin(request);
    await refreshSession();
    const user = await getUser();
    if (!user?.id || !validEmail(user.email)) return json({ error: 'Connectez-vous pour accéder à votre profil.' }, 401);
    if (request.method === 'GET') {
      const db = getDatabase();
      const [profile] = await db.sql`
        SELECT prenom, nom, email, tel, adresse FROM client_profiles WHERE identity_id = ${user.id}
      `;
      return json({ profile: profile ? { ...profile, email: user.email } : null });
    }
    if (request.method === 'DELETE') {
      const db = getDatabase();
      await db.sql`DELETE FROM client_profiles WHERE identity_id = ${user.id}`;
      return json({ deleted: true });
    }
    let body;
    try {
      body = await readBody(request);
    } catch {
      return json({ error: 'Requête invalide.' }, 400);
    }
    const profile = {};
    for (const [field, limit] of Object.entries({ prenom: 100, nom: 100, tel: 40, adresse: 500 })) {
      if (typeof body[field] !== 'string') return json({ error: 'Profil invalide.' }, 400);
      profile[field] = body[field].trim();
      if (profile[field].length > limit || (field !== 'tel' && !profile[field])) {
        return json({ error: 'Renseignez prénom, nom et adresse, sans dépasser les longueurs autorisées.' }, 400);
      }
    }
    const db = getDatabase();
    const [saved] = await db.sql`
      INSERT INTO client_profiles (identity_id, prenom, nom, email, tel, adresse)
      VALUES (${user.id}, ${profile.prenom}, ${profile.nom}, ${user.email}, ${profile.tel}, ${profile.adresse})
      ON CONFLICT (identity_id) DO UPDATE SET
        prenom = EXCLUDED.prenom, nom = EXCLUDED.nom, email = EXCLUDED.email,
        tel = EXCLUDED.tel, adresse = EXCLUDED.adresse, updated_at = NOW()
      RETURNING prenom, nom, email, tel, adresse
    `;
    return json({ profile: saved });
  } catch (error) {
    if (error instanceof AuthError && error.status === 403) return json({ error: 'Origine non autorisée.' }, 403);
    return json({ error: 'Impossible d’accéder au profil. Réessayez plus tard.' }, 503);
  }
}
