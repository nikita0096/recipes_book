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

  return (
    <section className="animated-hero">
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

      <div className="scroll-cta">
        <div className="scroll-cta-line"></div>
        <div className="scroll-cta-dot"></div>
        <span style={{ marginTop: '4px' }}>Scroll</span>
      </div>
    </section>
  );
};

export default AnimatedHero;