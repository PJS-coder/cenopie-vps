import React from 'react';

interface VerificationBadgeProps {
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export default function VerificationBadge({
  isVerified = false,
  size = 'md',
  showTooltip = true,
  className = ''
}: VerificationBadgeProps) {
  if (!isVerified) return null;

  // BADGE CONTAINER SIZE: The whole badge remains small
  const sizeClasses = {
    sm: 'w-4 h-4', 
    md: 'w-5 h-5', 
    lg: 'w-6 h-6' 
  } as const;

  const svgSize = {
    sm: 8,
    md: 10,
    lg: 12
  } as const;

  // ⭐️ INCREASED SCALE: Making the tick big inside its small container
  const checkmarkScale = {
    sm: 0.8, // Tick is now very large relative to the w-4 h-4 container
    md: 1.0, // Tick fills the w-5 h-5 container
    lg: 1.15 // Tick slightly overfills the w-6 h-6 container
  } as const;
  
  // ⭐️ BOLD STROKE WIDTH: Maximum thickness for a bold appearance
  const boldSharpStrokeWidth = 4.0; // Maxed out for this scale to be bold but not messy
  
  // Set a high miter limit for the sharpest possible corner join
  const sharpMiterLimit = 10; 

  // Offset for the 3D checkmark shadow/bevel
  const shadowOffset = {
    sm: 0.3,
    md: 0.4,
    lg: 0.5
  } as const;

  // Original Instagram-style burst (8 edges) for the badge shape
  const instaBurst =
    'polygon(50% 0%, 65% 10%, 85% 15%, 90% 35%, 100% 50%, 90% 65%, 85% 85%, 65% 90%, 50% 100%, 35% 90%, 15% 85%, 10% 65%, 0% 50%, 10% 35%, 15% 15%, 35% 10%)';

  // Styles for the Gold Badge background
  const goldStyles = {
    clipPath: instaBurst,
    background:
      'linear-gradient(145deg, #FFD700 10%, #FFC107 50%, #E6B800 90%)',
    boxShadow:
      '0 2px 4px rgba(0,0,0,0.2), inset 0 0.5px 0.5px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.1)',
    borderRadius: '8%'
  };

  // The wide, aggressive checkmark path remains for sharpness
  const boldSharpCheckPath = "M 1 12 L 8 20 L 23 2"; 
  const customViewBox = "0 0 24 24";


  return (
    <div
      className={`relative inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}
      title={showTooltip ? 'Verified' : undefined}
      aria-label="Verified"
    >
      {/* Gold burst background */}
      <div
        className="absolute inset-0"
        style={goldStyles}
      />

      {/* Gloss shine effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: instaBurst,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 35%, transparent 60%)',
          opacity: 0.8,
          mixBlendMode: 'overlay'
        }}
      />

      {/* 3D Checkmark */}
      <div className="relative z-10 flex items-center justify-center">
        <svg
          width={svgSize[size]}
          height={svgSize[size]}
          viewBox={customViewBox}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
          style={{ transform: `scale(${checkmarkScale[size]})` }} // BOLD and BIG
        >
          {/* 3D Shadow/Depth Path (Light gold for the beveled edge) */}
          <path
            d={boldSharpCheckPath}
            stroke="#e0c76f" 
            strokeWidth={boldSharpStrokeWidth} // BOLD stroke
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeMiterlimit={sharpMiterLimit} // Fixed: should be strokeMiterlimit (lowercase 'l')
            transform={`translate(0, ${shadowOffset[size]})`}
          />

          {/* Main White Checkmark (Lighter layer for the top surface) */}
          <path
            d={boldSharpCheckPath}
            stroke="#fff"
            strokeWidth={boldSharpStrokeWidth} // BOLD stroke
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeMiterlimit={sharpMiterLimit} // Fixed: should be strokeMiterlimit (lowercase 'l')
          />
        </svg>
      </div>
    </div>
  );
}