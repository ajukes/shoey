'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const inputClasses = `
    w-full
    bg-white/10
    backdrop-blur-md
    border border-white/20
    rounded-lg
    px-3 py-2.5 md:px-4 md:py-3
    text-sm md:text-base
    text-white
    placeholder-white/60
    transition-all duration-300 ease-in-out
    focus:bg-white/15
    focus:border-white/30
    focus:outline-none
    focus:ring-2 focus:ring-white/10
    ${Icon && iconPosition === 'left' ? 'pl-10 md:pl-11' : ''}
    ${Icon && iconPosition === 'right' ? 'pr-10 md:pr-11' : ''}
    ${error ? 'border-red-400/50 focus:border-red-400/70' : ''}
  `;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white/80">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className={`
            absolute inset-y-0 flex items-center pointer-events-none z-10
            ${iconPosition === 'left' ? 'left-3' : 'right-3'}
          `}>
            <Icon size={18} className="text-white/60" />
          </div>
        )}
        
        <input
          className={`${inputClasses} ${className}`}
          {...props}
        />
        
        {/* Glass shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none rounded-lg" />
      </div>

      {error && (
        <p className="text-sm text-red-400/80 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};