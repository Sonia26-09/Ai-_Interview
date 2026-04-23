/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["mongodb-memory-server", "mongodb", "mongoose"],
  },
};

module.exports = nextConfig;
