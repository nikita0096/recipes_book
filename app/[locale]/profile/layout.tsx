import React from 'react';

interface HomeLayoutProps {
  children: React.ReactNode;
}

export default function ProfileLayout({ children }: HomeLayoutProps) {
  return (
    <div>
      {children}
    </div>
  );
}
