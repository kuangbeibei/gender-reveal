/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 14 后正确的写法是 serverComponentsExternalPackages
  serverComponentsExternalPackages: ['pdf-parse'],
};

export default nextConfig;