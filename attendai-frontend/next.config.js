/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produce a self-contained runtime in .next/standalone so the Docker image
  // can copy ~50 MB instead of pulling in node_modules.
  output: "standalone",
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
    return [
      {
        source: "/api/backend/:path*",
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};
module.exports = nextConfig;
