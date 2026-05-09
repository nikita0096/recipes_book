'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { PAGES } from '@/config/page.config';

interface AnimatedHeroProps {
  discoverText?: string;
  recipesText?: string;
  words?: string[];
  byAuthor?: string;
  browseText?: string;
  aboutText?: string;
}

const AnimatedHero = ({
  discoverText = 'Discover',
  recipesText = 'Recipes',
  words = ['Delicious', 'Inspiring', 'Handcrafted', 'Authentic', 'Beautiful', 'Timeless'],
  byAuthor = 'by Yuliia Stohantseva',
  browseText = 'Browse recipes',
  aboutText = 'About the author',
}: AnimatedHeroProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const scrollHintRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (words.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
      }, 300);
    }, 2500);

    return () => clearInterval(interval);
  }, [words.length]);

  useEffect(() => {
    const onScroll = () => {
      if(!wrapperRef.current || !scrollHintRef.current) return;

      const el = wrapperRef.current;
      const rect = el.getBoundingClientRect();

      // p = 0 когда элемент вверху, p = 1 когда проскроллен на 30% высоты
      const p = Math.max(0, Math.min(1, -rect.top / (el.clientHeight * 0.4)));

      scrollHintRef.current.style.opacity = String(1 - p);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
    }
  }, []);

  return (
    <section className="animated-hero" ref={wrapperRef}>
      <div className="hero-top">
        <h1 className="hero-title">
          <span className="line-static">{discoverText}</span>
          <span className="word-flipper">
            <span className={`word-current ${isAnimating ? 'word-exit' : ''}`}>
              {words[currentIndex]}
            </span>
          </span>
          <span className="line-static">{recipesText}</span>
        </h1>

        <p className="hero-byline">{byAuthor}</p>

        <div className="hero-cta">
          <Link href={PAGES.RECIPES} className="btn-primary">
            {browseText}
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 8h10M9 4l4 4-4 4"/>
            </svg>
          </Link>
          <Link href={PAGES.ABOUT} className="btn-ghost">
            {aboutText}
          </Link>
        </div>
      </div>

      <div className="scroll-cta" ref={scrollHintRef}>
        <div className="scroll-cta-line"></div>
        <div className="scroll-cta-dot"></div>
      </div>
    </section>
  );
};

export default AnimatedHero;