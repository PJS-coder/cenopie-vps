interface CenopieLogoProps {
  className?: string;
  showBeta?: boolean;
}

export default function CenopieLogo({ className = "", showBeta = true }: CenopieLogoProps) {
  // Always show beta in production since we're in beta phase
  const shouldShowBeta = showBeta && (
    process.env.NODE_ENV === 'development' || 
    process.env.NODE_ENV === 'production' || 
    process.env.NEXT_PUBLIC_SHOW_BETA === 'true'
  );
  
  return (
    <div className={`flex items-center shrink-0 relative ${className}`}>
      <span className="logo-part-ceno">ceno</span>
      <span className="logo-part-pie">pie</span>
      {shouldShowBeta && (
        <span className="ml-2 bg-gradient-to-r from-orange-400 to-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm uppercase tracking-wide">
          BETA
        </span>
      )}
    </div>
  );
}