import {
  AuthError, MissingIdentityError, acceptInvite, confirmEmail, getUser, login, logout,
  recoverPassword, refreshSession, requestPasswordRecovery, signup, verifyRequestOrigin
} from '@netlify/identity';
import { json, publicUser, readBody, validEmail } from '../lib/client-http.mjs';

export default async function customerAuth(request) {
  if (!['GET', 'POST'].includes(request.method)) {
    return json({ error: 'Méthode non autorisée.' }, 405, { Allow: 'GET, POST' });
  }
  try {
    if (request.method === 'GET') {
      await refreshSession();
      const user = await getUser();
      return json({ user: user ? publicUser(user) : null });
    }
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
    if (['confirm', 'recover', 'invite'].includes(body.action)) {
      if (typeof body.token !== 'string' || !/^[a-zA-Z0-9_-]{8,2048}$/.test(body.token)) {
        return json({ error: 'Lien invalide ou expiré.' }, 400);
      }
      if (body.action === 'recover' || body.action === 'invite') {
        if (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) {
          return json({ error: 'Le mot de passe doit contenir entre 8 et 128 caractères.' }, 400);
        }
        if (body.action === 'invite') await acceptInvite(body.token, body.password);
        else await recoverPassword(body.token, body.password);
      } else {
        await confirmEmail(body.token);
      }
      return json({ confirmed: true });
    }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!validEmail(email)) return json({ error: 'Adresse e-mail invalide.' }, 400);
    if (body.action === 'recovery-request') {
      try {
        await requestPasswordRecovery(email);
      } catch (error) {
        if (!(error instanceof AuthError) || ![400, 404, 422].includes(error.status)) throw error;
      }
      return json({ sent: true });
    }
    if (!['login', 'signup'].includes(body.action)) return json({ error: 'Action invalide.' }, 400);
    if (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) {
      return json({ error: 'Le mot de passe doit contenir entre 8 et 128 caractères.' }, 400);
    }
    if (body.action === 'signup') {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (name.length < 2 || name.length > 200) return json({ error: 'Merci de renseigner votre nom.' }, 400);
      const user = await signup(email, body.password, { full_name: name });
      return json({ confirmationRequired: !user.confirmedAt }, 201);
    }
    const user = await login(email, body.password);
    return json({ user: publicUser(user) });
  } catch (error) {
    if (error instanceof MissingIdentityError) {
      return json({ error: 'L’espace client est momentanément indisponible.' }, 503);
    }
    if (error instanceof AuthError) {
      if (error.status === 403 && request.headers.get('origin') !== new URL(request.url).origin) {
        return json({ error: 'Origine non autorisée.' }, 403);
      }
      if (error.status === 429) return json({ error: 'Trop de tentatives. Réessayez plus tard.' }, 429);
      if ([400, 401, 403, 404, 422].includes(error.status)) {
        return json({ error: 'Connexion ou inscription impossible. Vérifiez vos informations et la confirmation de votre e-mail.' }, 400);
      }
    }
    return json({ error: 'L’espace client est momentanément indisponible. Réessayez plus tard.' }, 503);
  }
}
