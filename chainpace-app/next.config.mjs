/** @type {import('next').NextConfig} */
const backend = process.env.BACKEND_URL || "http://127.0.0.1:8080";
const isProd = process.env.VERCEL || process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // On Vercel there is no local Go process. Phone/dev only.
    if (isProd && process.env.NEXT_PUBLIC_API_URL) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
