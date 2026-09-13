/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: process.env.AUTH_URL || 'http://auth-svc:5000/auth/:path*',
      },
      {
        source: '/api/identity/:path*',
        destination: process.env.IDENTITY_URL || 'http://identity-svc:5001/identity/:path*',
      },
      {
        source: '/api/dashboard/:path*',
        destination: process.env.DASHBOARD_URL || 'http://dashboard-svc:3001/dashboard/:path*',
      },
      {
        source: '/api/intake/:path*',
        destination: process.env.INTAKE_URL || 'http://intake-ai-svc:5002/intake/:path*',
      },
      {
        source: '/api/reminders/:path*',
        destination: process.env.REMINDERS_URL || 'http://reminder-svc:5003/reminders/:path*',
      },
      {
        source: '/api/predictions/:path*',
        destination: process.env.PREDICTIONS_URL || 'http://prediction-svc:5004/predictions/:path*',
      },
      {
        source: '/api/:path*',
        destination: process.env.API_URL || 'http://auth-svc:5000/api/:path*',
      },
      {
        source: '/auth/:path*',
        destination: process.env.AUTH_URL || 'http://auth-svc:5000/auth/:path*',
      },
    ];
  },
};

module.exports = nextConfig;