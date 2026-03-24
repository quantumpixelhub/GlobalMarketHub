import Link from 'next/link';
import { Globe } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'default' | 'light';
  className?: string;
}

export function Logo({ size = 'md', tone = 'default', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: {
      iconWrap: 'h-7 w-7',
      icon: 16,
      title: 'text-lg',
    },
    md: {
      iconWrap: 'h-8 w-8',
      icon: 18,
      title: 'text-xl',
    },
    lg: {
      iconWrap: 'h-9 w-9',
      icon: 20,
      title: 'text-2xl',
    },
  };

  const themeClasses =
    tone === 'light'
      ? {
          market: 'text-white',
          hub: 'text-amber-300',
          iconBg: 'bg-white/10 border border-white/25',
          iconColor: 'text-rose-200',
        }
      : {
          market: 'text-indigo-900',
          hub: 'text-amber-500',
          iconBg: 'bg-rose-50 border border-rose-200',
          iconColor: 'text-rose-700',
        };

  return (
    <Link 
      href="/" 
      className={`inline-flex items-center gap-2 hover:opacity-90 transition-opacity ${className}`}
    >
      <span className={`inline-flex items-center justify-center rounded-full ${sizeClasses[size].iconWrap} ${themeClasses.iconBg}`}>
        <Globe size={sizeClasses[size].icon} className={themeClasses.iconColor} />
      </span>
      <span className={`font-extrabold tracking-tight leading-none ${sizeClasses[size].title}`}>
        <span className={themeClasses.market}>GlobalMarket</span>
        <span className={themeClasses.hub}>Hub</span>
      </span>
    </Link>
  );
}
