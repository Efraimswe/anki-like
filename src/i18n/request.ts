import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LOCALES } from './routing';

export default getRequestConfig(async () => {
  // Onboarding is pure-localStorage — skip DB lookup entirely.
  const hdrs = await headers();
  if (hdrs.get('x-pathname')?.startsWith('/onboarding')) {
    return {
      locale: 'en',
      messages: (await import('../../messages/en.json')).default,
    };
  }

  let locale = 'en';

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (token) {
      const payload = await verifyAccessToken(token);
      if (payload?.sub) {
        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: { interfaceLanguage: true },
        });
        const lang = user?.interfaceLanguage ?? 'en';
        if ((LOCALES as readonly string[]).includes(lang)) {
          locale = lang;
        }
      }
    }
  } catch {
    // fall back to 'en' on any error
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
