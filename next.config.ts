import type {NextConfig} from "next";

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

export default nextConfig;
