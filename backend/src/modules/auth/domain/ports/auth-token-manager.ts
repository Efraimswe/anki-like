export interface TokenCookies {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

export abstract class AuthTokenManager {
  abstract issueTokens(userId: string, sessionId: string, refreshToken: string): TokenCookies;
}
