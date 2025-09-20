'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'glass';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  active?: boolean;
  icon?: LucideIcon;
  iconOnly?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  active = false,
  disabled,
  icon: Icon,
  iconOnly = false,
  className = '',
  ...props
}) => {
  const baseClasses = `
    relative overflow-hidden
    backdrop-blur-md
    border border-white/20
    transition-all duration-300 ease-in-out
    font-medium tracking-wide
    cursor-pointer
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    ${fullWidth ? 'w-full' : ''}
  `;

  const sizeClasses = {
    xs: `${iconOnly ? 'p-1.5' : 'px-2 py-1'} text-xs rounded-md`,
    sm: `${iconOnly ? 'p-2' : 'px-3 py-2'} text-sm rounded-lg`,
    md: `${iconOnly ? 'p-2.5' : 'px-4 py-2.5 md:px-6 md:py-3'} text-sm md:text-base rounded-xl`,
    lg: `${iconOnly ? 'p-3' : 'px-6 py-3 md:px-8 md:py-4'} text-base md:text-lg rounded-xl`,
  };

  const variantClasses = {
    primary: `
      bg-gradient-primary text-white
      ${active 
        ? 'shadow-lg shadow-gradient-primary/40 scale-[0.98]'
        : 'hover:scale-105 hover:shadow-lg hover:shadow-gradient-primary/30'
      }
    `,
    secondary: `
      bg-gradient-secondary text-white
      ${active
        ? 'shadow-lg shadow-gradient-secondary/40 scale-[0.98]'  
        : 'hover:scale-105 hover:shadow-lg hover:shadow-gradient-secondary/30'
      }
    `,
    success: `
      bg-gradient-success text-white
      ${active
        ? 'shadow-lg shadow-gradient-success/40 scale-[0.98]'
        : 'hover:scale-105 hover:shadow-lg hover:shadow-gradient-success/30'
      }
    `,
    danger: `
      bg-gradient-danger text-white
      ${active
        ? 'shadow-lg shadow-gradient-danger/40 scale-[0.98]'
        : 'hover:scale-105 hover:shadow-lg hover:shadow-gradient-danger/30'
      }
    `,
    glass: `
      bg-white/10 text-white
      ${active
        ? 'bg-white/20 border-white/40 shadow-lg shadow-white/10'
        : 'hover:bg-white/15 hover:border-white/30 hover:shadow-md hover:shadow-white/5'
      }
    `,
  };

  const iconSize = {
    xs: 12,
    sm: 16, 
    md: 18,
    lg: 20,
  };

  return (
    <button
      className={`
        ${baseClasses} 
        ${sizeClasses[size]} 
        ${variantClasses[variant]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {/* Glass shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <svg
            className="animate-spin"
            width={iconSize[size]}
            height={iconSize[size]}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <>
            {Icon && <Icon size={iconSize[size]} />}
            {!iconOnly && children}
          </>
        )}
      </div>
    </button>
  );
};