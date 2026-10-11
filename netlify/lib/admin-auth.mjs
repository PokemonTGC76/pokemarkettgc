export const ADMIN_EMAILS = ['bryandu76@live.fr'];

export function isAdminEmail(email) {
  return typeof email === 'string' && ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export function isAdministrator(user) {
  if (!user?.confirmedAt) return false;
  return (Array.isArray(user.roles) && user.roles.includes('admin')) || isAdminEmail(user.email);
}
