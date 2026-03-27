import React from 'react';

interface HomeLayoutProps {
  children: React.ReactNode;
}

export default function ProfilePageLayout({ children }: HomeLayoutProps) {
  return (
    <div>
      {children}
    </div>
  );
}
