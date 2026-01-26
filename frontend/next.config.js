/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ultra-performance optimizations
  experimental: {
    // Enable all performance features
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react', '@radix-ui/react-icons', 'lucide-react'],
    // Enable partial prerendering for ultra-fast loading
    ppr: false, // Disable for now as it's still experimental
  },

  // Ultra-fast image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year cache
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Enable advanced optimizations
    unoptimized: false,
  },

  // Ultra-performance webpack optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Ultra-fast bundle splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Vendor chunk for third-party libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
          // Common chunk for shared components
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
          // UI components chunk
          ui: {
            test: /[\\/]components[\\/]ui[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 8,
          },
          // Hooks chunk
          hooks: {
            test: /[\\/]hooks[\\/]/,
            name: 'hooks',
            chunks: 'all',
            priority: 7,
          },
        },
      },
    };

    // Ultra-fast module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
      '@/components': require('path').resolve(__dirname, 'components'),
      '@/lib': require('path').resolve(__dirname, 'lib'),
      '@/hooks': require('path').resolve(__dirname, 'hooks'),
      '@/context': require('path').resolve(__dirname, 'context'),
    };

    // Resolve symlink issues
    config.resolve.symlinks = false;

    // Ultra-performance plugins
    if (!dev && !isServer) {
      // Bundle analyzer for optimization insights
      if (process.env.ANALYZE === 'true') {
        try {
          const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
          config.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              openAnalyzer: false,
              reportFilename: 'bundle-analysis.html',
            })
          );
        } catch (e) {
          console.warn('Bundle analyzer not available');
        }
      }

      // Compression plugin for ultra-small bundles
      try {
        const CompressionPlugin = require('compression-webpack-plugin');
        config.plugins.push(
          new CompressionPlugin({
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 1024,
            minRatio: 0.8,
          })
        );

        // Brotli compression for even better compression
        config.plugins.push(
          new CompressionPlugin({
            filename: '[path][base].br',
            algorithm: 'brotliCompress',
            test: /\.(js|css|html|svg)$/,
            compressionOptions: {
              level: 11,
            },
            threshold: 1024,
            minRatio: 0.8,
          })
        );
      } catch (e) {
        console.warn('Compression plugins not available');
      }
    }

    return config;
  },

  // Ultra-fast compilation - removed deprecated swcMinify
  
  // Ultra-performance headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Ultra-fast caching headers (only in production)
          ...(process.env.NODE_ENV === 'production' ? [{
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }] : [{
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          }]),
          // Performance hints
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          // Ultra-fast connection hints
          {
            key: 'Connection',
            value: 'keep-alive',
          },
          // Performance security headers
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
          // Ultra-performance CSP
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss: ws:;",
          },
        ],
      },
      // Static assets ultra-caching
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'production' 
              ? 'public, max-age=31536000, immutable'
              : 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      // API routes caching
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'production'
              ? 'public, max-age=300, s-maxage=300'
              : 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },

  // Ultra-fast redirects
  async redirects() {
    return [
      // Redirect www to non-www for performance
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.cenopie.com',
          },
        ],
        destination: 'https://cenopie.com/:path*',
        permanent: true,
      },
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Ultra-fast build optimizations
  compiler: {
    // Remove console.log in production for smaller bundles
    removeConsole: process.env.NODE_ENV === 'production',
    // Enable React refresh for ultra-fast development
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // Ultra-performance output
  output: 'standalone', // Optimize for deployment
  
  // Ultra-performance static optimization
  trailingSlash: false,
  
  // Ultra-fast page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
  // Ultra-performance environment variables
  env: {
    CUSTOM_KEY: 'ultra-performance-mode',
    BUILD_TIME: new Date().toISOString(),
  },

  // Ultra-fast TypeScript
  typescript: {
    ignoreBuildErrors: false, // Keep enabled for safety
  },

  // Ultra-performance PoweredByHeader
  poweredByHeader: false,

  // Ultra-fast compression
  compress: true,

  // Enable React strict mode for better performance
  reactStrictMode: true,

  // Disable source maps in production for smaller bundles
  productionBrowserSourceMaps: false,

  // Ultra-performance dev indicators
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },

  // Ultra-fast HTTP agent keep alive
  httpAgentOptions: {
    keepAlive: true,
  },

  // Turbopack configuration
  turbopack: {},
};

// Ultra-performance bundle analysis
if (process.env.ANALYZE === 'true') {
  try {
    const withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
      openAnalyzer: true,
    });
    module.exports = withBundleAnalyzer(nextConfig);
  } catch (e) {
    console.warn('Bundle analyzer not available, using default config');
    module.exports = nextConfig;
  }
} else {
  module.exports = nextConfig;
}