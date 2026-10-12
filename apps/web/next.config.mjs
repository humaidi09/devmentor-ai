/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // MVP velocity: don't block production builds on lint. Type-checking stays on.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
