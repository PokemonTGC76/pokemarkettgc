export function isAdministrator(user) {
  const hasAdminRole = user?.role === 'admin' || (Array.isArray(user?.roles) && user.roles.includes('admin'));
  return Boolean(user?.confirmedAt && hasAdminRole);
}
