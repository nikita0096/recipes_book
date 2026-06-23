'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { PAGES } from '@/config/page.config';
import {supabase} from "@/lib/supabase/ClientComponentClient";
import {useTranslations} from "next-intl";
import {useTypedLocale} from "@/hooks/useTypedLocale";

interface AnimatedHeroProps {
  discoverText?: string;
  recipesText?: string;
  byAuthor?: string;
  browseText?: string;
  aboutText?: string;
}

const AnimatedHero = ({
  discoverText = 'Discover',
  recipesText = 'Recipes',
  byAuthor = 'by Yuliia Stohantseva',
  browseText = 'Browse recipes',
  aboutText = 'About the author',
}: AnimatedHeroProps) => {
  const [height, setHeight] = useState(0);
  const [words, setWords] = useState<string[]>([]);

  const t = useTranslations('home');
  const defaultWords = t.raw('title.words') as string[];

  const locale = useTypedLocale();

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const scrollHintRef = useRef<HTMLDivElement | null>(null);

  const innerRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef(0);

  const interval = 2000;
  const duration = 700;

  useEffect(() => {
    const fetchAnimatedWords = async () => {
      const {data, error} = await supabase.from('author').select('animated_hero_words');

      const words = data?.[0]?.animated_hero_words?.[locale] as string[] | undefined;
      setWords(error || !words?.length ? defaultWords : words);
    }

    void fetchAnimatedWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

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
    <section className="animated-hero"
             ref={wrapperRef}>
      <div className="hero-top">
        <h1 className="hero-title">
          <span className="line-static">{discoverText}</span>
          <span
            className='word-wrapper'
            style={{ height: height || '1em' }}>
          <div
            ref={innerRef}
            className="flex flex-col will-change-transform"
            style={{ transition: `transform ${duration}ms cubic-bezier(0.76,0,0.24,1)` }}
          >
            {words.map((w, i) => (
              <span key={i} className="word-flipper">{w}</span>
            ))}
            <span className="word-flipper">{words[0]}</span>
          </div>
        </span>

          <span className="line-static">{recipesText}</span>
        </h1>

        <p className="hero-byline">{byAuthor}</p>

        <div className="hero-cta">
          <Link href={PAGES.RECIPES}
                className="btn-primary">
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
                className="btn-ghost">
            {aboutText}
          </Link>
        </div>
      </div>

      <div className="scroll-cta"
           ref={scrollHintRef}>
        <div className="scroll-cta-line"></div>
        <div className="scroll-cta-dot"></div>
      </div>
    </section>
  );
};

export default AnimatedHero;