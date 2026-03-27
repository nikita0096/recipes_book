'use client';

import React from 'react';
import {useParams} from "next/navigation";
import {useUserStore} from "@/store/useUserStore";

const Page = () => {
  const params = useParams();
  const {user} = useUserStore();
  console.log(user);
  return (
    <div>
      Profile
    </div>
  );
};

export default Page;