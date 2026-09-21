/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    // Эти пакеты не бандлятся, а остаются в node_modules — так они
    // гарантированно попадают в standalone-выход и доступны seed-скрипту в Docker
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', 'nodemailer'],
    // Загрузка изображений через Server Actions (по умолчанию 1mb)
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
