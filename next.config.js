/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors https://*.wixsite.com https://*.wix.com 'self';" },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
