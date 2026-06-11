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

interface MetaChipProps {
  value: number;
  unit?: string;
  label: string;
}

const MetaChip: React.FC<MetaChipProps> = ({ value, unit, label }) => (
  <div className="flex items-baseline gap-2.5 py-2 sm:gap-2 sm:py-1 sm:border-r sm:border-border sm:pr-5 sm:mr-5 sm:last:pr-0 sm:last:mr-0 sm:last:border-r-0">
    <span className="text-sm text-text sm:text-xs sm:text-muted">{label}</span>
    <span aria-hidden="true" className="flex-1 border-b border-dotted border-border -translate-y-1 sm:hidden"/>
    <span
      className="text-base sm:text-lg leading-none text-text whitespace-nowrap"
      style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
    >
      {value}{unit && <span className="font-sans text-xs text-muted"> {unit}</span>}
    </span>
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

  const cards: MetaChipProps[] = [
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
    <section className="px-4 sm:px-6 lg:px-10 py-5 sm:py-6 lg:py-7 border-b border-border">
      <h2 className="text-xs tracking-widest uppercase text-accent mb-5">
        {t('singlePage.details')}
      </h2>
      <div className="sm:flex sm:flex-wrap sm:gap-y-2.5">
        {cards.map((card, index) => (
          <MetaChip key={index} {...card} />
        ))}
      </div>
    </section>
  );
};

export default RecipeMeta;