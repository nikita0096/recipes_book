import React from 'react';

const RecipeLoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-bg animate-pulse">
      {/* Hero */}
      <section className="relative w-full h-100 md:h-120 lg:h-150 bg-surface">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.08) 45%, transparent 100%)' }}
        />
        {/* Back placeholder */}
        <div className="absolute top-6 left-6 lg:top-10 lg:left-10 2xl:top-20 2xl:left-20 w-[46px] h-[46px] bg-white/12 border border-white/40" />
        {/* Like placeholder */}
        <div className="absolute top-6 right-6 lg:top-10 lg:right-10 2xl:top-20 2xl:right-20 w-[46px] h-[46px] bg-white/12 border border-white/40" />
        {/* Title block */}
        <div className="absolute bottom-7 left-5 sm:left-8 right-20 flex flex-col gap-3">
          <div className="h-5 w-28 bg-white/15 border border-accent/40" />
          <div className="h-10 w-3/4 max-w-lg bg-white/20 rounded" />
        </div>
      </section>

      {/* Meta stats tablet and laptop */}
      <div className="hidden md:grid grid-cols-3 sm:grid-cols-5 border-b border-border">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 py-5 border-r border-border last:border-r-0">
            <div className="h-4 w-10 bg-surface rounded" />
            <div className="h-3 w-12 bg-surface rounded" />
          </div>
        ))}
      </div>

      {/* Meta stats mobile */}
      <div className="grid md:hidden grid-cols-1 border-b border-border">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-row items-center gap-2 py-4 border-r border-border last:border-r-0 px-5">
            <div className="h-4 w-20 bg-surface rounded" />
            <div className="h-0.5 w-full bg-surface" />
            <div className="h-3 w-12 bg-surface rounded" />
          </div>
        ))}
      </div>

      {/* Description / ingredients placeholder */}
      <section className="px-4 sm:px-6 lg:px-10 py-6 sm:py-8 flex flex-col gap-3">
        <div className="h-3 w-24 bg-surface rounded" />
        <div className="h-4 w-full max-w-2xl bg-surface rounded" />
        <div className="h-4 w-5/6 max-w-2xl bg-surface rounded" />
        <div className="h-4 w-2/3 max-w-2xl bg-surface rounded" />
      </section>

      {/* Ingredients stats mobile */}
      <div className="grid md:hidden grid-cols-1 border-b border-border">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-row items-center gap-2 py-4 border-r border-border last:border-r-0 px-5">
            <div className="h-4 w-20 bg-surface rounded" />
            <div className="h-0.5 w-full bg-surface" />
            <div className="h-3 w-12 bg-surface rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeLoadingSkeleton;