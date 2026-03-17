import Link from 'next/link';

interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ variant = 'full', size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <Link 
      href="/" 
      className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}
    >
      {/* Logo Icon */}
      <div className={`${iconSizeClasses[size]} relative flex items-center justify-center`}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer Globe Circle */}
          <circle cx="50" cy="50" r="45" stroke="url(#gradient1)" strokeWidth="3" />
          
          {/* Globe Grid Lines */}
          <circle cx="50" cy="50" r="35" stroke="url(#gradient1)" strokeWidth="1.5" opacity="0.6" />
          <ellipse cx="50" cy="50" rx="35" ry="20" stroke="url(#gradient1)" strokeWidth="1.5" opacity="0.6" />
          <path d="M50 15 Q50 50 50 85" stroke="url(#gradient1)" strokeWidth="1.5" opacity="0.6" />
          <path d="M20 50 Q50 50 80 50" stroke="url(#gradient1)" strokeWidth="1.5" opacity="0.6" />
          
          {/* Center Trade/Exchange Symbol */}
          <g transform="translate(50, 50)">
            <circle r="8" fill="url(#gradient1)" opacity="0.2" />
            <path d="M-6 -2 L-2 -2 L0 0 L-2 2 L-6 2" stroke="url(#gradient1)" strokeWidth="1.5" fill="none" />
            <path d="M6 -2 L2 -2 L0 0 L2 2 L6 2" stroke="url(#gradient1)" strokeWidth="1.5" fill="none" />
          </g>
          
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Logo Text */}
      {variant === 'full' && (
        <div className="flex flex-col -gap-1">
          <div className={`${sizeClasses[size]} font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent`}>
            Global
          </div>
          <div className={`${sizeClasses[size]} font-bold bg-gradient-to-r from-emerald-700 to-emerald-800 bg-clip-text text-transparent`}>
            Market
          </div>
          <div className="text-xs font-semibold text-emerald-600 -mt-1">HUB</div>
        </div>
      )}
    </Link>
  );
}
