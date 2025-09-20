import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        background: {
          DEFAULT: "rgb(10, 11, 30)", // #0a0b1e
          secondary: "rgb(26, 27, 62)", // #1a1b3e
          tertiary: "rgb(42, 43, 78)", // #2a2b4e
        },
        // Glass colors
        glass: {
          light: "rgba(255, 255, 255, 0.1)",
          medium: "rgba(255, 255, 255, 0.15)",
          dark: "rgba(17, 24, 39, 0.8)",
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)',
        'gradient-success': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'gradient-danger': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'gradient-background': 'linear-gradient(135deg, #0a0b1e 0%, #1a1b3e 50%, #2a2b4e 100%)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'fadeInUp': 'fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'pulseGlow': 'pulseGlow 2s ease-in-out infinite',
        'gradientShift': 'gradientShift 15s ease infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1', 
            transform: 'translateY(0)',
          },
        },
        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 10px rgba(102, 126, 234, 0.3), 0 0 20px rgba(102, 126, 234, 0.2), inset 0 0 10px rgba(102, 126, 234, 0.1)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(102, 126, 234, 0.5), 0 0 30px rgba(102, 126, 234, 0.3), inset 0 0 15px rgba(102, 126, 234, 0.2)',
          },
        },
        gradientShift: {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;