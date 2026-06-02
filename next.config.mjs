import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

// Security headers applied to every response.
const securityHeaders = [
  // Stop the browser from MIME-sniffing a response away from the declared type.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Disallow framing to mitigate clickjacking.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Don't leak full URLs to third parties.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Lock down powerful browser features (geolocation kept for live tracking).
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), payment=(), geolocation=(self)' },
  // Force HTTPS for two years, including subdomains.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Belt-and-braces against legacy XSS in old browsers.
  { key: 'X-XSS-Protection', value: '1; mode=block' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't advertise the framework/version.
  poweredByHeader: false,
  reactStrictMode: true,
  // Drop console.* (except warn/error) from production bundles for smaller, faster JS.
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.commuter.site',
        pathname: '/storage/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
