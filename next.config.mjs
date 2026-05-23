import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable persistent build caching. This stops next-intl's dynamic
  // `import(t)` from triggering the noisy webpack PackFileCacheStrategy
  // warning, and guarantees every build sees fresh sources.
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

export default withNextIntl(nextConfig);
