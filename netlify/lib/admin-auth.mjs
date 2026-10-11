export function isAdministrator(user) {
  return Boolean(user?.confirmedAt && Array.isArray(user.roles) && user.roles.includes('admin'));
}
