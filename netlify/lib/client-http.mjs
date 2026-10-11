export function json(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', ...headers }
  });
}

export async function readBody(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    throw new Error('invalid-body');
  }
  const text = await request.text();
  if (Buffer.byteLength(text) > 8192) throw new Error('invalid-body');
  const body = JSON.parse(text);
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid-body');
  return body;
}

export function validEmail(email) {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name || '' };
}
