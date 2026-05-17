/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a fully static site to ./out — pure HTML / JS / CSS, no Node server needed.
  // Open out/index.html directly, or upload the folder to any static host.
  output: 'export',

  // Disable Next/Image optimization (it requires a Node runtime).
  images: { unoptimized: true },

  // Optional: append trailing slashes so paths work when opened via file://
  trailingSlash: true,

  reactStrictMode: true,
};

export default nextConfig;
