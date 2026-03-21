import React from 'react';

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