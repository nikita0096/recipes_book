'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { PAGES } from '@/config/page.config';
import {useTranslations} from "next-intl";
import {useTypedLocale} from "@/hooks/useTypedLocale";
import styles from "./AnimatedHero.module.css";

interface AnimatedHeroProps {
  discoverText?: string;
  recipesText?: string;
  byAuthor?: string;
  browseText?: string;
  aboutText?: string;
  wordsList: {
    en: string[];
    uk: string[];
  } | null;
}

const AnimatedHero = ({
  discoverText = 'Discover',
  recipesText = 'Recipes',
  byAuthor = 'by Yuliia Stohantseva',
  browseText = 'Browse recipes',
  aboutText = 'About the author',
  wordsList
}: AnimatedHeroProps) => {
  const [height, setHeight] = useState(0);

  const t = useTranslations('home');
  const locale = useTypedLocale();

  const defaultWords = t.raw('title.words') as string[];
  const words = wordsList !== null ? wordsList[locale] : defaultWords;


  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const scrollHintRef = useRef<HTMLDivElement | null>(null);

  const innerRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef(0);

  const interval = 2000;
  const duration = 700;

  useEffect(() => {
    const measure = () => {
      const first = innerRef.current?.children[0];
      if (first) setHeight(first.clientHeight);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);   // ← cleanup #1
  }, [words]);

  useEffect(() => {
    if (!height) return;

    const inner = innerRef.current;
    if (!inner) return;

    const id = setInterval(() => {
      currentRef.current += 1;
      inner.style.transform = `translateY(-${currentRef.current * height}px)`;

      if (currentRef.current >= words.length) {
        setTimeout(() => {
          inner.style.transition = 'none';
          inner.style.transform = `translateY(0px)`;
          currentRef.current = 0;

          // Force reflow to apply the instant reset
          void inner.offsetHeight;

          // Restore transition
          inner.style.transition = `transform ${duration}ms cubic-bezier(0.76,0,0.24,1)`;
        }, duration);
      }
    }, interval);

    return () => clearInterval(id);
  }, [height, words, interval, duration]);

  useEffect(() => {
    const onScroll = () => {
      if (!wrapperRef.current || !scrollHintRef.current) return;

      const el = wrapperRef.current;
      const rect = el.getBoundingClientRect();

      const p = Math.max(0, Math.min(1, -rect.top / (el.clientHeight * 0.4)));

      scrollHintRef.current.style.opacity = String(1 - p);
    }

    window.addEventListener('scroll', onScroll, {passive: true});
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
    }
  }, []);

  return (
    <section className={styles['animated-hero']}
             ref={wrapperRef}>
      <div className={styles['hero-top']}>
        <h1 className={styles['hero-title']}>
          <span className={styles['line-static']}>{discoverText}</span>
          <span
            className={styles['word-wrapper']}
            style={{ height: height || '1em' }}>
          <div
            ref={innerRef}
            className="flex flex-col will-change-transform"
            style={{ transition: `transform ${duration}ms cubic-bezier(0.76,0,0.24,1)` }}
          >
            {words.map((w, i) => (
              <span key={i} className={styles['word-flipper']}>{w}</span>
            ))}
            <span className={styles['word-flipper']}>{words[0]}</span>
          </div>
        </span>

          <span className={styles['line-static']}>{recipesText}</span>
        </h1>

        <p className={styles['hero-byline']}>{byAuthor}</p>

        <div className={styles['hero-cta']}>
          <Link href={PAGES.RECIPES}
                className={styles['btn-primary']}>
            {browseText}
            <svg width="12"
                 height="12"
                 viewBox="0 0 16 16"
                 fill="none"
                 stroke="currentColor"
                 strokeWidth="2">
              <path d="M3 8h10M9 4l4 4-4 4"/>
            </svg>
          </Link>
          <Link href={PAGES.ABOUT}
                className={styles['btn-ghost']}>
            {aboutText}
          </Link>
        </div>
      </div>

      <div className={styles['scroll-cta']}
           ref={scrollHintRef}>
        <div className={styles['scroll-cta-line']}></div>
        <div className={styles['scroll-cta-dot']}></div>
      </div>
    </section>
  );
};

export default AnimatedHero;