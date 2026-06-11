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
  value: number;
  unit?: string;
  label: string;
}

const MetaCard: React.FC<MetaCardProps> = ({ value, unit, label }) => (
  <div className="flex flex-col gap-1.5">
    <div
      className="text-2xl sm:text-3xl leading-none text-text whitespace-nowrap"
      style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
    >
      {value}{unit && <span className="font-sans text-xs text-muted ml-1">{unit}</span>}
    </div>
    <div className="text-xs tracking-widest uppercase text-accent">{label}</div>
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
      value: preparingTime,
      unit: t('singlePage.meta.minUnit'),
      label: t('singlePage.meta.time'),
    },
    {
      value: stepsCount,
      unit: stepsCount === 1 ? t('singlePage.meta.stepUnit') : t('singlePage.meta.stepsUnit'),
      label: t('singlePage.meta.preparation'),
    },
  ];

  if (weight) {
    cards.push({
      value: weight,
      unit: t('singlePage.meta.gramUnit'),
      label: t('singlePage.meta.weight'),
    });
  }

  if (diameter) {
    cards.push({
      value: diameter,
      unit: t('singlePage.meta.cmUnit'),
      label: t('singlePage.meta.diameter'),
    });
  }

  if (calories) {
    cards.push({
      value: calories,
      unit: t('singlePage.meta.kcalUnit'),
      label: t('singlePage.meta.perServing'),
    });
  }

  return (
    <section className="px-4 sm:px-6 lg:px-10 py-5 sm:py-6 lg:py-8 border-b border-border">
      <div className="flex flex-wrap gap-5 sm:gap-7 lg:gap-9 py-5">
        {cards.map((card, index) => (
          <MetaCard key={index} {...card} />
        ))}
      </div>
    </section>
  );
};

export default RecipeMeta;