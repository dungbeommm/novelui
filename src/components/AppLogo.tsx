import React from 'react';

interface AppLogoProps {
  className?: string;
  color?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = 'w-7 h-7', color = 'currentColor' }) => (
  <svg viewBox="0 0 108 108" className={className} fill="none" aria-hidden="true">
    <g transform="translate(54 55.5) scale(1.55) translate(-54 -54)">
      <path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M54,34 C46,29 36,27 24,29 L24,73 C36,71 46,73 54,78 Z M35,44.5 L48,51.5 L35,58.5 Z"
      />
      <path
        stroke={color}
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M54,34 C62,29 72,27 84,29 L84,73 C72,71 62,73 54,78"
      />
      <path
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M60,52 L63.5,52 L66.5,42 L70,61 L73.5,46 L76.5,54 L80,54"
      />
    </g>
  </svg>
);
