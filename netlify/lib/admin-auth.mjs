import { AuthError, MissingIdentityError, getUser, refreshSession, verifyRequestOrigin } from '@netlify/identity';
import { json } from './client-http.mjs';

export function isAdministrator(user) {
  return Boolean(user?.confirmedAt && Array.isArray(user.roles) && user.roles.includes('admin'));
}

// Returns null when the request comes from a confirmed admin, or the error Response to send otherwise.
export async function requireAdmin(request) {
  try {
    if (request.method !== 'GET') verifyRequestOrigin(request);
    await refreshSession();
    const user = await getUser();
    if (!user) return json({ error: 'Connectez-vous avec votre compte administrateur.' }, 401);
    if (!isAdministrator(user)) return json({ error: 'Accès réservé aux administrateurs.' }, 403);
    return null;
  } catch (error) {
    if (error instanceof AuthError && error.status === 403) return json({ error: 'Origine non autorisée.' }, 403);
    if (error instanceof MissingIdentityError || error instanceof AuthError) {
      return json({ error: 'Connectez-vous avec votre compte administrateur.' }, 401);
    }
    return json({ error: 'La vérification administrateur est indisponible. Réessayez plus tard.' }, 503);
  }
}
