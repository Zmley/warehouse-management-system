/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [process.env.IMAGE_URL]
  },
  env: {
    MONGODB_URL: process.env.MONGODB_URL,
    IMAGE_URL: process.env.IMAGE_URL
  }
}

module.exports = nextConfig
