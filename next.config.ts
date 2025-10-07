import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static exports for deployment
  output: 'export',
  trailingSlash: true,
  
  // Image optimization
  images: {
    unoptimized: true,
  },
  
  // Note: headers and rewrites don't work with static export
  // For production deployment, configure CORS headers at the hosting level
  // (Vercel, Netlify, etc. handle this automatically for API routes)
};

export default nextConfig;
