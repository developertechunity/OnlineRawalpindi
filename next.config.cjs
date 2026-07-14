/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        appDir: true,
    },
    images: {
        domains: ['localhost', 'res.cloudinary.com'],
    },
    // ✅ Windows CSS fix
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
            };
        }
        return config;
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: process.env.NODE_ENV === 'production'
                    ? '/api/:path*'
                    : 'http://localhost:5002/api/:path*',
            },
        ];
    },
};

module.exports = nextConfig;