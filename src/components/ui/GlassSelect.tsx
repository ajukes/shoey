'use client';

import React from 'react';

interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function GlassSelect({ 
  label, 
  error, 
  options, 
  className = '', 
  ...props 
}: GlassSelectProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white/80">
          {label}
        </label>
      )}
      <select
        className={`
          w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-3 text-white
          focus:border-white/40 focus:outline-none
          [&>option]:bg-gray-800 [&>option]:text-white
          ${error ? 'border-red-400/50' : ''}
          ${className}
        `}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-gray-800 text-white">
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}
    </div>
  );
}