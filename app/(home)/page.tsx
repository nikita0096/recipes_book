'use client';

import {useEffect, useState} from "react";

export default function Home() {

  const [scale, setScale] = useState(2);

  useEffect(() => {
    const handleScroll = () => {
      const progress = window.scrollY / (document.body.scrollHeight - window.innerHeight);

      const scaled = 2 - progress * 1.2; // 0.8 = коэффициент увеличения
      setScale(Math.max(scaled, 1));
    }

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  },[]);


  return (
    <div
      style={{
        // transform: `scale(${scale})`,
        height: 'calc(100vh - 61px)',
      }}
      className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans bg-[url('https://i.pinimg.com/1200x/1b/ed/81/1bed81e6288a8d1ed71f3bd577163228.jpg')] bg-center bg-no-repeat bg-cover">
    </div>
  );
}
