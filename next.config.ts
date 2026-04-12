import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['bcrypt', '@open-spaced-repetition/binding'],
};

export default nextConfig;
