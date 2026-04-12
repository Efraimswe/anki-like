import { NextResponse } from 'next/server';
import { getAuthUser, type TokenPayload } from './auth';

export function jsonError(statusCode: number, message: string) {
  return NextResponse.json(
    { statusCode, message, error: statusText(statusCode) },
    { status: statusCode },
  );
}

function statusText(code: number): string {
  const texts: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
  };
  return texts[code] || 'Error';
}

export async function requireAuth(): Promise<TokenPayload | NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return jsonError(401, 'Unauthorized');
  }
  return user;
}
