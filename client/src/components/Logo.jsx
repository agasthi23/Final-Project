// src/components/Logo.jsx
import React from 'react';
import './Logo.css';

const Logo = ({ size = 40, showText = true, variant = 'default' }) => {
  // Colors based on dark blue theme
  const primaryColor = variant === 'light' ? '#ffffff' : '#3B82F6'; // Bright blue
  const secondaryColor = variant === 'light' ? '#60A5FA' : '#1E40AF'; // Lighter/darker blue
  
  
  return (
    <div className={`logo-container ${variant}`}>
      <div className="logo-wrapper">
        {/* Outer animated ring */}
        <svg 
          width={size * 1.4} 
          height={size * 1.4} 
          viewBox="0 0 140 140" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="logo-outer-ring"
        >
          <circle 
            cx="70" 
            cy="70" 
            r="65" 
            stroke={primaryColor} 
            strokeWidth="1" 
            strokeDasharray="8 4"
            opacity="0.4"
          />
        </svg>
        
        {/* Middle animated ring */}
        <svg 
          width={size * 1.2} 
          height={size * 1.2} 
          viewBox="0 0 120 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="logo-middle-ring"
        >
          <circle 
            cx="60" 
            cy="60" 
            r="55" 
            stroke={secondaryColor} 
            strokeWidth="1.5" 
            strokeDasharray="6 6"
            opacity="0.6"
          />
        </svg>
        
        {/* Main logo icon */}
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Utilyze Logo"
          className="logo-icon"
        >
          {/* Background circle with gradient */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primaryColor} />
              <stop offset="100%" stopColor={secondaryColor} />
            </linearGradient>
            <filter id="logoGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="logoShadow">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3"/>
            </filter>
          </defs>
          
          {/* Background circle */}
          <circle cx="50" cy="50" r="45" fill="url(#logoGradient)" filter="url(#logoShadow)" />
          
          {/* Inner circle for depth */}
          <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          
          {/* Lightning bolt representing energy */}
          <path 
            d="M50 20 L35 45 L45 45 L40 65 L55 40 L45 40 Z" 
            fill="#ffffff" 
            filter="url(#logoGlow)"
          />
          
          {/* Analytics line representing data and insights */}
          <path 
            d="M30 70 L40 60 L50 65 L60 55 L70 60" 
            stroke="#ffffff" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          
          {/* Small dots for data points */}
          <circle cx="30" cy="70" r="2" fill="#ffffff" />
          <circle cx="40" cy="60" r="2" fill="#ffffff" />
          <circle cx="50" cy="65" r="2" fill="#ffffff" />
          <circle cx="60" cy="55" r="2" fill="#ffffff" />
          <circle cx="70" cy="60" r="2" fill="#ffffff" />
        </svg>
        
        {/* Animated pulse effect */}
        <div className="logo-pulse"></div>
      </div>
      
      {/* The "Utilyze" text, shown conditionally */}
      {showText && (
        <div className="logo-text-container">
          <span 
            className="logo-text"
            style={{ fontSize: `${size * 0.5}px` }}
          >
            Utilyze
          </span>
          <div className="logo-text-underline"></div>
        </div>
      )}
    </div>
  );
};

export default Logo;