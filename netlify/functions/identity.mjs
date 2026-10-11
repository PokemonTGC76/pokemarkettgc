import { isAdminEmail } from '../lib/admin-auth.mjs';

function withAdminRole(user) {
  if (!user?.confirmedAt || !isAdminEmail(user.email)) return undefined;
  const roles = Array.isArray(user.appMetadata?.roles) ? user.appMetadata.roles : [];
  if (roles.includes('admin')) return undefined;
  return { user: { ...user, appMetadata: { ...user.appMetadata, roles: [...roles, 'admin'] } } };
}

export default {
  userSignup(event) {
    return withAdminRole(event.user);
  },
  userLogin(event) {
    return withAdminRole(event.user);
  }
};
