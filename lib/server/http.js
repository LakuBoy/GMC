// Small request helpers with no database or sign-in imports, so they are easy to test.
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Browsers send Origin on every cross-site write. Reject any that does not match the host.
export function sameOrigin(headers) {
  if (!headers.origin) return true;
  try {
    return new URL(headers.origin).host === headers.host;
  } catch {
    return false;
  }
}

// Errors raised before a connection exists. The request never left, so repeating it cannot do anything twice.
const NEVER_SENT = new Set(['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ENETUNREACH', 'EHOSTUNREACH', 'UND_ERR_CONNECT_TIMEOUT']);

function neverSent(error) {
  const cause = error?.cause;
  if (!cause) return false;
  // Node reports a failed attempt on several addresses as a list.
  if (cause.errors?.length) return cause.errors.every((e) => e.syscall === 'connect' || NEVER_SENT.has(e.code));
  return NEVER_SENT.has(cause.code) || cause.syscall === 'connect';
}

export async function fetchWithRetry(url, options, { tries = 3, delayMs = 400, send = fetch } = {}) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await send(url, options);
    } catch (e) {
      if (attempt >= tries || !neverSent(e)) throw e;
      await new Promise((r) => setTimeout(r, delayMs * attempt));
    }
  }
}
