'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface CakeHeroProps {
  words?: string[];
  byAuthor?: string;
  scrollText?: string;
}

const CakeHero = ({
  words = ['Desserts'],
  byAuthor,
  scrollText = 'scroll'
}: CakeHeroProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const finalTextRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const wordIndexRef = useRef(0);
  const plateRef = useRef<HTMLDivElement>(null);

  const [showTitle, setShowTitle] = useState(false);

  const layerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const labelRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const layers = [
    { id: 'layer1', src: '/images/cake-layer/layer_1.jpg', dy: 0, lblId: 'lbl1', label: 'Sponge base', threshold: 0.18, delay: 0, zIndex: 1 },
    { id: 'layer2', src: '/images/cake-layer/layer_2.jpg', dy: -70, lblId: 'lbl2', label: 'Strawberry jam', threshold: 0.26, delay: 150, zIndex: 2 },
    { id: 'layer3', src: '/images/cake-layer/layer_3.jpg', dy: -140, lblId: 'lbl3', label: 'Pistachio cheesecake', threshold: 0.34, delay: 300, zIndex: 3 },
    { id: 'layer4', src: '/images/cake-layer/layer_4.jpg', dy: -210, lblId: 'lbl4', label: 'Strawberry jam', threshold: 0.42, delay: 450, zIndex: 4 },
    { id: 'layer5', src: '/images/cake-layer/layer_5.jpg', dy: -280, lblId: 'lbl5', label: 'Top sponge', threshold: 0.50, delay: 600, zIndex: 5 },
    { id: 'layer6', src: '/images/cake-layer/layer_6.jpg', dy: -350, lblId: 'lbl6', label: 'Decoration', threshold: 0.58, delay: 750, zIndex: 6 },
  ];

  // Intro animation - layers falling down
  useEffect(() => {
    // Show plate first
    if (plateRef.current) {
      plateRef.current.classList.add('cake-intro-visible');
    }

    // Animate each layer falling
    layers.forEach((layer) => {
      setTimeout(() => {
        const el = layerRefs.current[layer.id];
        if (el) {
          el.classList.add('cake-intro-landed');
        }
      }, layer.delay + 200);
    });

    // Show title after all layers landed
    const titleDelay = 750 + 600; // last layer delay + animation time
    setTimeout(() => {
      setShowTitle(true);
    }, titleDelay);

    // Remove intro classes after animation to enable scroll animation
    const cleanupDelay = titleDelay + 300;
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

  // Word rotation animation
  useEffect(() => {
    if (words.length <= 1) return;

    const titleInterval = setInterval(() => {
      if (!titleRef.current) return;

      titleRef.current.style.opacity = '0';
      titleRef.current.style.transform = 'translateY(-20px) scale(0.95)';

      setTimeout(() => {
        if (!titleRef.current) return;

        wordIndexRef.current = (wordIndexRef.current + 1) % words.length;
        titleRef.current.textContent = words[wordIndexRef.current];

        titleRef.current.style.opacity = '1';
        titleRef.current.style.transform = 'translateY(0) scale(1)';
      }, 400);
    }, 3000);

    return () => clearInterval(titleInterval);
  }, [words]);

  // Generate particles on mount
  useEffect(() => {
    if (!particlesRef.current) return;

    const colors = ['#cc8b4e', '#f5d855', '#f8f0e2', '#7b3010', '#a07850', '#ffb6c1'];
    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'cake-particle';
      const size = Math.random() * 6 + 2;
      const x = 5 + Math.random() * 90; // 5% to 95% width
      const dx = (Math.random() - 0.5) * 80 + 'px';
      const dur = 4 + Math.random() * 6;
      const delay = Math.random() * 8;
      const bottom = 20 + Math.random() * 20; // varied starting height

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

      const scrollTop = window.scrollY;
      const totalScroll = wrapperRef.current.scrollHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, scrollTop / totalScroll));

      if (progressFillRef.current) {
        progressFillRef.current.style.height = (p * 100) + '%';
      }

      if (scrollHintRef.current) {
        scrollHintRef.current.style.opacity = String(Math.max(0, 1 - p * 10));
      }

      if (heroTextRef.current) {
        heroTextRef.current.style.opacity = String(Math.max(0, 1 - p * 5));
      }

      const sepStart = 0.05;
      const sepEnd = 0.80;
      const sp = Math.max(0, Math.min(1, (p - sepStart) / (sepEnd - sepStart)));

      layers.forEach(layer => {
        const el = layerRefs.current[layer.id];
        const lbl = labelRefs.current[layer.lblId];
        if (!el) return;

        const offset = easeInOut(sp) * layer.dy;
        el.style.transform = `translateX(-50%) translateY(${offset}px)`;

        if (lbl) {
          const lblP = Math.max(0, Math.min(1, (sp - layer.threshold) / 0.14));
          lbl.style.opacity = String(lblP);
          lbl.style.transform = `translateY(-50%) translateX(${(1 - lblP) * -10}px)`;
        }
      });

      if (finalTextRef.current) {
        finalTextRef.current.style.opacity = p > 0.82 ? String(Math.min(1, (p - 0.82) / 0.1)) : '0';
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
        {/* Background layers */}
        <div className="cake-bg-image" />
        <div className="cake-bg-overlay-1" />
        <div className="cake-bg-overlay-2" />
        <div className="cake-bg-glow" />

        {/* Particles */}
        <div ref={particlesRef} />

        {/* Title */}
        <div className={`cake-hero-text ${showTitle ? 'cake-intro-title-visible' : 'cake-intro-title-hidden'}`} ref={heroTextRef}>
          <h1 className="cake-hero-title-wrapper">
            <span
              ref={titleRef}
              className="cake-hero-animated-title"
            >
              {words[0]}
            </span>
          </h1>
          {byAuthor && (
            <p className="cake-hero-author">{byAuthor}</p>
          )}
        </div>

        {/* Cake */}
        <div className="cake-stage">
          <div className="cake-plate cake-intro-plate" ref={plateRef} />

          {layers.map((layer) => (
            <div
              key={layer.id}
              className="cake-layer cake-layer-img cake-intro-layer"
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

        <div className={`cake-scroll-hint ${showTitle ? 'cake-intro-visible' : ''}`} ref={scrollHintRef}>
          <div className="cake-scroll-arrow" />
          <span>{scrollText}</span>
        </div>

        <div className="cake-progress-track">
          <div className="cake-progress-fill" ref={progressFillRef} />
        </div>

        <div className="cake-final-text" ref={finalTextRef}>
          <p>Every layer, crafted with intention</p>
        </div>
      </div>
    </div>
  );
};

export default CakeHero;