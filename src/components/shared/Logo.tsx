import Link from 'next/link';

interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ variant = 'full', size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-12',
    md: 'w-20',
    lg: 'w-24',
  };

  return (
    <Link 
      href="/" 
      className={`flex items-center gap-3 hover:opacity-90 transition-opacity ${className}`}
    >
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        <svg viewBox="0 0 400 300" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg" fill="none">
          {/* Globe */}
          <g>
            {/* Globe outer circle */}
            <circle cx="130" cy="100" r="80" fill="#E3F2FD" stroke="#1E40AF" strokeWidth="3" />
            
            {/* Globe grid pattern */}
            <circle cx="130" cy="100" r="70" fill="none" stroke="#1E40AF" strokeWidth="1.5" opacity="0.5" />
            <ellipse cx="130" cy="100" rx="70" ry="35" fill="none" stroke="#1E40AF" strokeWidth="1.5" opacity="0.5" />
            <path d="M130 30 Q130 100 130 170" fill="none" stroke="#1E40AF" strokeWidth="1.5" opacity="0.5" />
            <path d="M60 100 Q130 100 200 100" fill="none" stroke="#1E40AF" strokeWidth="1.5" opacity="0.5" />
            
            {/* Globe nodes/dots */}
            <circle cx="120" cy="70" r="4" fill="#1E40AF" />
            <circle cx="145" cy="75" r="4" fill="#1E40AF" />
            <circle cx="155" cy="100" r="4" fill="#1E40AF" />
            <circle cx="140" cy="125" r="4" fill="#1E40AF" />
            <circle cx="110" cy="130" r="4" fill="#1E40AF" />
            
            {/* Orange swoosh arrow */}
            <path d="M 70 150 Q 100 160 150 150 Q 180 145 190 120" 
                  fill="none" stroke="#FFA500" strokeWidth="18" strokeLinecap="round" />
            <polygon points="190,120 210,100 200,135" fill="#FFA500" />
          </g>
          
          {/* Text - GlobalMarketHub */}
          {variant === 'full' && (
            <g>
              {/* "Global" in dark blue */}
              <text x="250" y="95" fontSize="48" fontWeight="bold" fill="#1E40AF" fontFamily="system-ui, -apple-system, sans-serif">
                Global
              </text>
              {/* "Market" in dark blue */}
              <text x="250" y="145" fontSize="48" fontWeight="bold" fill="#1E40AF" fontFamily="system-ui, -apple-system, sans-serif">
                Market
              </text>
              {/* "Hub" in green */}
              <text x="250" y="190" fontSize="42" fontWeight="bold" fill="#16A34A" fontFamily="system-ui, -apple-system, sans-serif">
                Hub
              </text>
            </g>
          )}
        </svg>
      </div>
    </Link>
  );
}
