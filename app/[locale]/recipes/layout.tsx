import React from 'react';
import Header from "@/components/header/Header";

interface HomeLayoutProps {
  children: React.ReactNode;
}

export default function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <div>
      {children}
    </div>
  );
}
