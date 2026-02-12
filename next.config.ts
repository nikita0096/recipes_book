import type {NextConfig} from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
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