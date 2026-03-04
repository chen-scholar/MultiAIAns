/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Docs 页在运行时用 fs 读根目录的 docs.md，
    // 这里显式把它带进构建产物，部署到 Vercel 等平台后才读得到。
    outputFileTracingIncludes: {
      "/docs": ["./docs.md"],
    },
  },
};

export default nextConfig;
