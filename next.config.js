// next.config.js - FULLY OPTIMIZED
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Keep StrictMode OFF to prevent double auth calls in development
  reactStrictMode: false,
  
  output: 'standalone',
  
  // ✅ Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mvittkvxtasayycmzgha.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
  },
  
  // ✅ Enable compression
  compress: true,
  
  // ✅ Disable source maps in production
  productionBrowserSourceMaps: false,
  
  // ✅ Experimental optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons', 
      'sonner',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-slot',
      'framer-motion',
      'recharts',
    ],
    // ✅ Enable scroll restoration
    scrollRestoration: true,
  },
  
  // ✅ Webpack configuration
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }
    
    // ✅ Watch options - ignore system files
    config.watchOptions = {
      ignored: [
        '**/node_modules',
        '**/.git',
        '**/.next',
        '**/System Volume Information',
        '**/pagefile.sys',
        '**/hiberfil.sys',
        '**/swapfile.sys',
        'C:/System Volume Information',
        'C:/pagefile.sys',
        'C:/hiberfil.sys',
        'C:/swapfile.sys',
        'C:/Windows',
        'C:/Program Files',
        'C:/Program Files (x86)',
      ],
      poll: dev ? 1000 : false, // Poll in dev, no poll in production
      aggregateTimeout: 300,
    };
    
    // ✅ Ignore warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@radix-ui/ },
      { message: /Failed to parse source map/ },
      { message: /Source map error/ },
      { file: /LayoutGroupContext\.mjs\.map/ },
      { message: /Watchpack Error/ },
      { message: /EINVAL: invalid argument/ },
      { message: /lstat/ },
      { message: /System Volume Information/ },
    ];
    
    // ✅ Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Separate vendor chunks
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                const packageName = module.context.match(
                  /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                )[1];
                return `vendor.${packageName.replace('@', '')}`;
              },
              priority: 10,
              minChunks: 1,
            },
            // Common chunks
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
            // Supabase chunk
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'vendor.supabase',
              priority: 20,
            },
          },
        },
        // Minimize CSS
        minimize: true,
      };
    }
    
    return config;
  },
  
  // ✅ URL rewrites
  async rewrites() {
    return [
      {
        source: '/icon-192.png',
        destination: '/favicon.png',
      },
      {
        source: '/icon-512.png',
        destination: '/favicon.png',
      },
      {
        source: '/apple-icon.png',
        destination: '/favicon.png',
      },
      {
        source: '/apple-icon-180.png',
        destination: '/favicon.png',
      },
    ];
  },
  
  // ✅ Security headers + Caching
  async headers() {
    return [
      // Global security headers
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Admin pages - no cache
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate',
          },
        ],
      },
      // Staff pages - short cache
      {
        source: '/staff/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, max-age=0, must-revalidate',
          },
        ],
      },
      // Student pages - short cache
      {
        source: '/student/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, max-age=0, must-revalidate',
          },
        ],
      },
      // Static images - long cache
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // Fonts - immutable cache
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Next.js static assets - immutable
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API routes - no cache
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  
  // ✅ Development optimizations
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 60 seconds
    pagesBufferLength: 5,
  },
  
  // ✅ Remove X-Powered-By header
  poweredByHeader: false,
  
  // ✅ Transpile packages for better tree-shaking
  transpilePackages: [
    'lucide-react', 
    'sonner',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
  ],
  
  // ✅ TypeScript and ESLint
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;