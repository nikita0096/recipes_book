'use client';

import React, {useState} from 'react';
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ThemeProvider} from "next-themes";

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({children}) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class"
                     enableSystem
                     defaultTheme='system'>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default Providers;