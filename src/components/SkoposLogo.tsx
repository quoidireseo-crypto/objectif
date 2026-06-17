import React from 'react';

interface SkoposLogoProps {
  className?: string;
  size?: number;
}

export function SkoposLogo({ className = '', size = 32 }: SkoposLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Circle Ring */}
      <circle 
        cx="50" 
        cy="50" 
        r="40" 
        stroke="currentColor" 
        strokeWidth="7" 
      />
      {/* Middle Circle Ring */}
      <circle 
        cx="50" 
        cy="50" 
        r="24" 
        stroke="currentColor" 
        strokeWidth="7" 
      />
      {/* Center Solid Dot */}
      <circle 
        cx="50" 
        cy="50" 
        r="8" 
        fill="currentColor" 
      />
    </svg>
  );
}
