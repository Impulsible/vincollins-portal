// next.config.js - COMPLETE WITH CACHE PREVENTION
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Keep StrictMode OFF to prevent double auth calls in development
  reactStrictMode: false,
  
  // ✅ COMMENT THIS OUT TO FIX WINDOWS + PNPM SYMLINK ERRORS
  // output: 'standalone',
  
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
      poll: dev ? 1000 : false,
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
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                if (!module.context) {
                  return 'vendor.unknown';
                }
                const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
                if (!match) {
                  return 'vendor.unknown';
                }
                const packageName = match[1];
                return `vendor.${packageName.replace('@', '')}`;
              },
              priority: 10,
              minChunks: 1,
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'vendor.supabase',
              priority: 20,
            },
          },
        },
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
  
  // ✅ Security headers + Caching (COMPLETE)
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
      
      // ✅ PORTAL PAGE - NO CACHE (critical for login)
      {
        source: '/portal',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, private',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      
      // ✅ ADMIN PORTAL
      {
        source: '/admin/portal',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, private',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      
      // ✅ FORGOT PASSWORD - NO CACHE
      {
        source: '/forgot-password',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, private',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      
      // ✅ RESET PASSWORD - NO CACHE
      {
        source: '/reset-password',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, private',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      
      // ✅ Dashboard pages - NO CACHE
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, private',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/staff/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, private',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/student/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, private',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
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
            value: 'no-store, must-revalidate, private',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      // Home and public pages - short cache
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=600',
          },
        ],
      },
      {
        source: '/about',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/contact',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/admission',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/schools',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  
  // ✅ Development optimizations
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
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