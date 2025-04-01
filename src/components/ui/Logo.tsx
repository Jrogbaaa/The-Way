import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  // Size mappings
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const sizeClass = sizes[size];

  return (
    <div className={`${sizeClass} ${className} relative flex-shrink-0`}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600"></div>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Circuit board / AI neural network base */}
        <path 
          d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 16.6944 7.30558 20.5 12 20.5C16.6944 20.5 20.5 16.6944 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5Z" 
          stroke="rgba(255,255,255,0.9)" 
          strokeWidth="0.75"
          fill="none"
        />
        
        {/* Circuit lines */}
        <path 
          d="M12 3.5V6.5M20.5 12H17.5M12 20.5V17.5M3.5 12H6.5" 
          stroke="rgba(255,255,255,0.9)" 
          strokeWidth="0.75" 
        />
        
        {/* Chip / processor in center */}
        <rect 
          x="9" 
          y="9" 
          width="6" 
          height="6" 
          rx="1"
          fill="rgba(255,255,255,0.9)" 
        />
        
        {/* Connection dots (representing social network) */}
        <circle cx="12" cy="6.5" r="1" fill="rgba(255,255,255,0.9)" />
        <circle cx="17.5" cy="12" r="1" fill="rgba(255,255,255,0.9)" />
        <circle cx="12" cy="17.5" r="1" fill="rgba(255,255,255,0.9)" />
        <circle cx="6.5" cy="12" r="1" fill="rgba(255,255,255,0.9)" />
        
        {/* Social network connections */}
        <path 
          d="M8.5 8.5L10 10M15.5 8.5L14 10M15.5 15.5L14 14M8.5 15.5L10 14" 
          stroke="rgba(255,255,255,0.9)" 
          strokeWidth="0.75" 
          strokeLinecap="round"
        />
        
        {/* Connection dots at corners (additional network nodes) */}
        <circle cx="8.5" cy="8.5" r="0.8" fill="rgba(255,255,255,0.9)" />
        <circle cx="15.5" cy="8.5" r="0.8" fill="rgba(255,255,255,0.9)" />
        <circle cx="15.5" cy="15.5" r="0.8" fill="rgba(255,255,255,0.9)" />
        <circle cx="8.5" cy="15.5" r="0.8" fill="rgba(255,255,255,0.9)" />
      </svg>
    </div>
  );
};

export default Logo; 