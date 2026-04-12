export abstract class UserAgentParser {
  abstract parse(userAgent: string | null): string | null;
}
