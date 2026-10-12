const ADMIN_ROLES = new Set(['admin', 'administrateur']);

export function isAdministrator(user) {
  if (!user?.confirmedAt || !Array.isArray(user.roles)) return false;
  return user.roles.some((role) => typeof role === 'string' && ADMIN_ROLES.has(role.trim().toLowerCase()));
}
