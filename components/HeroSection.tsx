import React from 'react';

interface HeroSectionProps {
  title: React.ReactNode;
  description: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  breadcrumbs?: React.ReactNode;
}

export default function HeroSection({ title, description, children, className = '', breadcrumbs }: HeroSectionProps) {
  const topPadding = breadcrumbs ? 'pt-6' : 'pt-12';
  const breadcrumbsMargin = breadcrumbs ? 'mb-4' : 'mb-8';
  return (
    <section className={`bg-primary-light-100 ${topPadding} pb-14 w-full ${className}`}>
      {breadcrumbs && (
        <div className={`max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 ${breadcrumbsMargin}`} aria-label="Breadcrumb">
          {breadcrumbs}
        </div>
      )}
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
          {title}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto px-6 sm:px-0">
          {description}
        </p>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
} 