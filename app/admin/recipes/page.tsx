'use client';

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import AdminRecipesItems from "@/app/admin/recipes/AdminRecipesItems";

const queryClient = new QueryClient();

const Page = () => {


  return (
    <QueryClientProvider client={queryClient}>
      <AdminRecipesItems/>
    </QueryClientProvider>
  );
};

export default Page;