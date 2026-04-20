import React from 'react';
import type {Metadata} from "next";

export const metadata: Metadata = {
  title: "Recipes",
  description: "Recipes list",
};


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
