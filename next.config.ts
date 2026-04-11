import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://explorer-api.walletconnect.com https://*.walletconnect.com",
  "font-src 'self'",
  "connect-src 'self' https://earn.li.fi https://li.quest https://api.morpho.org https://api.groq.com wss://relay.walletconnect.com https://explorer-api.walletconnect.com https://*.walletconnect.com https://*.infura.io https://*.alchemy.com wss://*.infura.io",
  "frame-src https://verify.walletconnect.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'Content-Security-Policy', value: csp },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }];
  },
};

export default nextConfig;
