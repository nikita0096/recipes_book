'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';

interface CakeHeroProps {
  scrollText?: string;
}

const CakeHero = ({
  scrollText = 'scroll'
}: CakeHeroProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const recipeCardRef = useRef<HTMLDivElement>(null);

  const [showHint, setShowHint] = useState(false);

  const layerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const labelRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const layers = [
    { id: 'layer1', src: '/images/cake-layer/layer_1.jpg', dy: 0, lblId: 'lbl1', label: 'Sponge base', threshold: 0.18, delay: 0, zIndex: 1 },
    { id: 'layer2', src: '/images/cake-layer/layer_4.jpg', dy: -55, lblId: 'lbl2', label: 'Strawberry jam', threshold: 0.26, delay: 150, zIndex: 2 },
    { id: 'layer3', src: '/images/cake-layer/layer_3.jpg', dy: -110, lblId: 'lbl3', label: 'Pistachio cheesecake', threshold: 0.34, delay: 300, zIndex: 3 },
    { id: 'layer4', src: '/images/cake-layer/layer_2.jpg', dy: -165, lblId: 'lbl4', label: 'Strawberry jam', threshold: 0.42, delay: 450, zIndex: 4 },
    { id: 'layer5', src: '/images/cake-layer/layer_5.jpg', dy: -220, lblId: 'lbl5', label: 'Top sponge', threshold: 0.50, delay: 600, zIndex: 5 },
    { id: 'layer6', src: '/images/cake-layer/layer_6.jpg', dy: -275, lblId: 'lbl6', label: 'Decoration', threshold: 0.58, delay: 750, zIndex: 6 },
  ];

  // Intro animation - layers falling down
  useEffect(() => {
    if (plateRef.current) {
      plateRef.current.classList.add('cake-intro-visible');
    }

    layers.forEach((layer) => {
      setTimeout(() => {
        const el = layerRefs.current[layer.id];
        if (el) {
          el.classList.add('cake-intro-landed');
        }
      }, layer.delay + 200);
    });

    const hintDelay = 750 + 600;
    setTimeout(() => {
      setShowHint(true);
    }, hintDelay);

    const cleanupDelay = hintDelay + 300;
    setTimeout(() => {
      layers.forEach((layer) => {
        const el = layerRefs.current[layer.id];
        if (el) {
          el.classList.remove('cake-intro-layer', 'cake-intro-landed');
          el.style.opacity = '1';
        }
      });
    }, cleanupDelay);
  }, []);

  // Generate particles on mount
  useEffect(() => {
    if (!particlesRef.current) return;

    const colors = ['#cc8b4e', '#f5d855', '#f8f0e2', '#7b3010', '#a07850', '#ffb6c1'];
    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'cake-particle';
      const size = Math.random() * 6 + 2;
      const x = 5 + Math.random() * 90;
      const dx = (Math.random() - 0.5) * 80 + 'px';
      const dur = 4 + Math.random() * 6;
      const delay = Math.random() * 8;
      const bottom = 20 + Math.random() * 20;

      p.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${x}%;
        bottom: ${bottom}%;
        --dx: ${dx};
        animation-duration: ${dur}s;
        animation-delay: ${delay}s;
      `;
      particlesRef.current.appendChild(p);
      particles.push(p);
    }

    return () => {
      particles.forEach(p => p.remove());
    };
  }, []);

  // Scroll animation
  useEffect(() => {
    const easeInOut = (t: number) => {
      t = Math.max(0, Math.min(1, t));
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    };

    const onScroll = () => {
      if (!wrapperRef.current) return;

      const wrapperTop = wrapperRef.current.offsetTop;
      const wrapperHeight = wrapperRef.current.scrollHeight;
      const scrollTop = window.scrollY;

      const scrollWithinWrapper = scrollTop - wrapperTop;
      const totalScrollInWrapper = wrapperHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, scrollWithinWrapper / totalScrollInWrapper));

      if (progressFillRef.current) {
        progressFillRef.current.style.height = (p * 100) + '%';
      }

      if (scrollHintRef.current) {
        scrollHintRef.current.style.opacity = String(Math.max(0, 1 - p * 100));
      }

      const sepStart = 0.05;
      const sepEnd = 0.80;
      const sp = Math.max(0, Math.min(1, (p - sepStart) / (sepEnd - sepStart)));

      layers.forEach((layer) => {
        const el = layerRefs.current[layer.id];
        const lbl = labelRefs.current[layer.lblId];
        if (!el) return;

        const offset = easeInOut(sp) * layer.dy;
        el.style.transform = `translateX(-50%) translateY(${offset}px)`;

        const lblP = Math.max(0, Math.min(1, (sp - layer.threshold) / 0.14));

        if (lbl) {
          lbl.style.opacity = String(lblP);
          lbl.style.transform = `translateY(-50%) translateX(${(1 - lblP) * -10}px)`;
        }
      });

      // Animate recipe card smoothly based on scroll progress (starts later)
      if (recipeCardRef.current) {
        const cardStart = 0.2;
        const cardProgress = Math.max(0, (sp - cardStart) / (1 - cardStart));
        const cardOpacity = Math.min(1, cardProgress * 2.5);

        // Check if mobile (card is positioned at bottom)
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          const cardTranslateY = Math.max(0, 20 - cardProgress * 40);
          recipeCardRef.current.style.opacity = String(cardOpacity);
          recipeCardRef.current.style.transform = `translateX(-50%) translateY(${cardTranslateY}px)`;
        } else {
          const cardTranslateX = Math.max(0, 20 - cardProgress * 40);
          recipeCardRef.current.style.opacity = String(cardOpacity);
          recipeCardRef.current.style.transform = `translateY(-50%) translateX(${cardTranslateX}px)`;
        }
      }

          };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="cake-hero-wrapper" ref={wrapperRef}>
      <div className="cake-sticky-scene">
        <div className="cake-bg-image" />
        <div className="cake-bg-glow" />

        <div ref={particlesRef} />

        {/* Recipe Card - Left Side */}
        <div className="cake-recipe-card" ref={recipeCardRef}>
          <span className="cake-recipe-label">Recipe</span>
          <div className="cake-recipe-divider" />
          <h3 className="cake-recipe-title">Pistachio Strawberry Cake</h3>
          <div className="cake-recipe-meta">
            <span className="cake-recipe-time">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              120 min
            </span>
            <span className="cake-recipe-steps">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
                <path d="M9 12h6M9 16h6"/>
              </svg>
              12 steps
            </span>
          </div>
          <div className="cake-recipe-divider" />
          <Link href="/recipes" className="cake-recipe-link">
            View Recipe
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

        <div className="cake-stage">
          <div className="cake-plate" ref={plateRef} />
          {layers.map((layer) => (
            <div
              key={layer.id}
              className="cake-layer cake-layer-img"
              style={{ zIndex: layer.zIndex }}
              ref={(el) => { layerRefs.current[layer.id] = el; }}
            >
              <Image
                src={layer.src}
                alt={layer.label}
                width={280}
                height={120}
                className="cake-layer-image"
                priority
              />
              <div
                className="cake-lbl"
                ref={(el) => { labelRefs.current[layer.lblId] = el; }}
              >
                {layer.label}
              </div>
            </div>
          ))}
        </div>

        <div className={`cake-scroll-hint ${showHint ? 'cake-intro-visible' : ''}`} ref={scrollHintRef}>
          <div className="cake-scroll-arrow" />
          <span>{scrollText}</span>
        </div>

        <div className="cake-progress-track">
          <div className="cake-progress-fill" ref={progressFillRef} />
        </div>
      </div>
    </div>
  );
};

export default CakeHero;
