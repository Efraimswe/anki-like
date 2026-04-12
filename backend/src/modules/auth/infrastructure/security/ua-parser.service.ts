import { Injectable } from '@nestjs/common';
import * as UAParser from 'ua-parser-js';
import { UserAgentParser } from '../../domain/ports/user-agent-parser';

@Injectable()
export class UaParserService implements UserAgentParser {
  parse(userAgent: string | null): string | null {
    if (!userAgent) {
      return null;
    }

    const parser = new UAParser.UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const parts = [
      browser.name,
      browser.version ? `${browser.version}` : null,
      os.name ? `on ${os.name}` : null,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(' ') : userAgent.substring(0, 100);
  }
}
