import type {NextConfig} from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/:locale/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  images: {
    // Uploaded replacements use new filenames, so cached photos can live longer.
    minimumCacheTTL: 2678400,
    deviceSizes: [640, 960, 1280, 1600, 1920],
    imageSizes: [32, 64, 96, 160, 320, 480],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: "images.pexels.com",
      },
      {
        protocol: 'https',
        hostname: "images.unsplash.com",
      },
      {
        protocol: 'https',
        hostname: "media.istockphoto.com",
      },{
        protocol: 'https',
        hostname: "c0.klipartz.com",
      },{
        protocol: 'https',
        hostname: "lh3.googleusercontent.com",
      },{
        protocol: 'https',
        hostname: "ksaxqjcaaotkxpkagweo.supabase.co",
      },
    ]
  }
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
