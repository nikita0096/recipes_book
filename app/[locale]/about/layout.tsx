import React from 'react';
import type {Metadata} from "next";

export const metadata: Metadata = {
  title: "About Yuliia",
  description: "Introduction",
};

interface AboutLayoutProps {
  children: React.ReactNode;
}


export default function AboutLayout({ children }: AboutLayoutProps) {
  return (
    <div>
      {children}
    </div>
  );
}