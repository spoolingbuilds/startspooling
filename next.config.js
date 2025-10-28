/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore for optimization testing
  },
  // Compression is enabled by default in Next.js
  compress: true,
  // Optimize images
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
  },
  // Performance optimizations
  poweredByHeader: false,
  generateEtags: true,
  reactStrictMode: true,
  // Output source maps in production for better debugging (remove if needed)
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
