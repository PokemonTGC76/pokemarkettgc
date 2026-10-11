import {
  AuthError, MissingIdentityError, admin, getUser, login, logout, refreshSession, verifyRequestOrigin
} from '@netlify/identity';
import { isAdministrator } from '../lib/admin-auth.mjs';
import { json, publicUser, readBody, validEmail } from '../lib/client-http.mjs';

export default async function adminAuth(request) {
  if (!['GET', 'POST'].includes(request.method)) {
    return json({ error: 'Méthode non autorisée.' }, 405, { Allow: 'GET, POST' });
  }
  try {
    let user;
    if (request.method === 'GET') {
      await refreshSession();
      user = await getUser();
      if (!user) return json({ error: 'Connectez-vous avec votre compte administrateur.' }, 401);
      if (!user.confirmedAt) {
        try {
          user = await admin.getUser(user.id);
        } catch {
          return json({ error: 'Impossible de vérifier les droits administrateur pour le moment. Réessayez plus tard.' }, 503);
        }
      }
    } else {
      verifyRequestOrigin(request);
      let body;
      try {
        body = await readBody(request);
      } catch {
        return json({ error: 'Requête invalide.' }, 400);
      }
      if (body.action === 'logout') {
        await logout();
        return json({ user: null });
      }
      if (body.action !== 'login') return json({ error: 'Action invalide.' }, 400);
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (!validEmail(email) || typeof body.password !== 'string' || !body.password || body.password.length > 128) {
        return json({ error: 'Renseignez votre adresse e-mail et votre mot de passe.' }, 400);
      }
      user = await login(email, body.password);
    }
    if (!isAdministrator(user)) {
      if (request.method === 'POST') await logout();
      const error = user.confirmedAt
        ? 'Ce compte ne possède pas le rôle admin dans Netlify Identity. Vérifiez ses droits, puis reconnectez-vous.'
        : 'Confirmez votre adresse e-mail ou acceptez votre invitation Netlify Identity avant de vous connecter.';
      return json({ error }, 403);
    }
    return json({ user: publicUser(user) });
  } catch (error) {
    if (error instanceof MissingIdentityError) {
      return json({ error: 'La connexion administrateur est momentanément indisponible.' }, 503);
    }
    if (error instanceof AuthError) {
      if (error.status === 429) return json({ error: 'Trop de tentatives. Réessayez plus tard.' }, 429);
      if (error.status === 403 && request.headers.get('origin') !== new URL(request.url).origin) {
        return json({ error: 'Origine non autorisée.' }, 403);
      }
      if ([400, 401, 403, 404, 422].includes(error.status)) {
        return json({ error: 'Connexion impossible. Vérifiez vos identifiants et la confirmation de votre e-mail.' }, 401);
      }
    }
    return json({ error: 'La connexion administrateur est momentanément indisponible. Réessayez plus tard.' }, 503);
  }
}
