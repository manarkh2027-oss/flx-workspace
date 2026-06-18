/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Allow server actions when running behind the Render/Cloudflare proxy.
    serverActions: {
      allowedOrigins: ['flx-workspace.onrender.com', 'localhost:3000'],
    },
  },
};

export default nextConfig;
