'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface RecipeMetaProps {
  preparingTime: number;
  stepsCount: number;
  weight?: number | null;
  diameter?: number | null;
  calories?: number | null;
}

interface MetaCardProps {
  icon: string;
  value: number;
  unit: string;
  label: string;
}

const MetaCard: React.FC<MetaCardProps> = ({ icon, value, unit, label }) => (
  <div className="bg-bg p-4 sm:p-5 lg:p-6 flex flex-col gap-2 sm:gap-2.5">
    <span className="text-base text-accent leading-none" style={{ fontFamily: 'sans-serif' }}>{icon}</span>
    <div className="font-serif text-xl sm:text-2xl lg:text-3xl text-text leading-none">
      {value} <span className="font-sans text-sm sm:text-base text-muted">{unit}</span>
    </div>
    <div className="text-[10px] sm:text-xs tracking-widest uppercase text-muted">{label}</div>
  </div>
);

const RecipeMeta: React.FC<RecipeMetaProps> = ({
  preparingTime,
  stepsCount,
  weight,
  diameter,
  calories,
}) => {
  const t = useTranslations('recipes');

  const cards: MetaCardProps[] = [
    {
      icon: '◷',
      value: preparingTime,
      unit: t('singlePage.meta.minUnit'),
      label: t('singlePage.meta.time'),
    },
    {
      icon: '☰',
      value: stepsCount,
      unit: stepsCount === 1 ? t('singlePage.meta.stepUnit') : t('singlePage.meta.stepsUnit'),
      label: t('singlePage.meta.preparation'),
    },
  ];

  if (weight) {
    cards.push({
      icon: '⚖︎',
      value: weight,
      unit: t('singlePage.meta.gramUnit'),
      label: t('singlePage.meta.weight'),
    });
  }

  if (diameter) {
    cards.push({
      icon: '⌀',
      value: diameter,
      unit: t('singlePage.meta.cmUnit'),
      label: t('singlePage.meta.diameter'),
    });
  }

  if (calories) {
    cards.push({
      icon: '◉',
      value: calories,
      unit: t('singlePage.meta.kcalUnit'),
      label: t('singlePage.meta.perServing'),
    });
  }

  // Dynamic grid columns based on card count
  const gridColsClass = cards.length <= 2
    ? 'grid-cols-2'
    : cards.length === 3
      ? 'grid-cols-2 sm:grid-cols-3'
      : cards.length === 4
        ? 'grid-cols-2 sm:grid-cols-4'
        : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';

  return (
    <section className="border-b border-border px-4 sm:px-6 lg:px-10 py-5 sm:py-6 lg:py-8">
      <div className={`grid ${gridColsClass} gap-px bg-border border border-border`}>
        {cards.map((card, index) => (
          <MetaCard key={index} {...card} />
        ))}
      </div>
    </section>
  );
};

export default RecipeMeta;