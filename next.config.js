
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // ✅ Correct for Next.js 14/15
    serverComponentsExternalPackages: ['pdfkit'],
  },
};

module.exports = nextConfig;
