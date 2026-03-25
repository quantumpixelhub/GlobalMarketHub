import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'default' | 'light';
  className?: string;
}

export function Logo({ size = 'md', tone = 'default', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: {
      iconWrap: 'h-8 w-8 rounded-lg',
      image: 28,
      title: 'text-lg',
    },
    md: {
      iconWrap: 'h-9 w-9 rounded-lg',
      image: 32,
      title: 'text-xl',
    },
    lg: {
      iconWrap: 'h-11 w-11 rounded-xl',
      image: 40,
      title: 'text-2xl',
    },
  };

  const themeClasses =
    tone === 'light'
      ? {
          market: 'text-white',
          hub: 'text-white',
          iconBg: 'bg-white border border-white/80 shadow-sm',
        }
      : {
          market: 'text-slate-800',
          hub: 'text-slate-800',
          iconBg: 'bg-white border border-slate-200 shadow-sm',
        };

  return (
    <Link 
      href="/" 
      className={`inline-flex items-center gap-2 hover:opacity-90 transition-opacity ${className}`}
    >
      <span className={`inline-flex items-center justify-center rounded-full ${sizeClasses[size].iconWrap} ${themeClasses.iconBg}`}>
        <Image
          src="/logo.png"
          alt="GlobalMarketHub"
          width={sizeClasses[size].image}
          height={sizeClasses[size].image}
          className="object-contain"
          priority={size === 'lg'}
        />
      </span>
      <span className={`font-extrabold tracking-tight leading-none ${sizeClasses[size].title}`}>
        <span className={themeClasses.market}>GlobalMarket</span>
        <span className={themeClasses.hub}>Hub</span>
      </span>
    </Link>
  );
}
