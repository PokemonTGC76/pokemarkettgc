const ADMIN_ROLES = new Set(['admin', 'administrateur', 'administrator']);

// Roles come from server-controlled app_metadata. confirmedAt is not required: it is absent when the
// user is rebuilt from session claims, and Identity never issues a session to an unconfirmed account.
export function isAdministrator(user) {
  if (!user || !Array.isArray(user.roles)) return false;
  return user.roles.some((role) => typeof role === 'string' && ADMIN_ROLES.has(role.trim().toLowerCase()));
}
