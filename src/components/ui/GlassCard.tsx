'use client';

import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'minimal';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = `
    backdrop-blur-md
    border border-white/10
    transition-all duration-300 ease-in-out
  `;

  const variantClasses = {
    default: `
      bg-white/5
      rounded-xl
      shadow-lg shadow-black/10
    `,
    elevated: `
      bg-glass-dark
      rounded-xl
      shadow-xl shadow-black/20
      hover:shadow-2xl hover:shadow-black/30
    `,
    minimal: `
      bg-white/3
      rounded-lg
      shadow-sm shadow-black/5
    `,
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3 md:p-4',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
  };

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};