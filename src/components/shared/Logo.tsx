import Link from 'next/link';
import Image from 'next/image';
import { Globe } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: 'default' | 'light';
  className?: string;
}

export function Logo({ size = 'md', tone = 'default', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: {
      widthClass: 'w-[170px]',
      heightClass: 'h-[42px]',
      titleClass: 'text-[30px]',
      iconWrap: 'h-8 w-8',
      iconSize: 18,
    },
    md: {
      widthClass: 'w-[205px]',
      heightClass: 'h-[50px]',
      titleClass: 'text-[34px]',
      iconWrap: 'h-9 w-9',
      iconSize: 20,
    },
    lg: {
      widthClass: 'w-[245px]',
      heightClass: 'h-[60px]',
      titleClass: 'text-[38px]',
      iconWrap: 'h-10 w-10',
      iconSize: 22,
    },
    xl: {
      widthClass: 'w-[320px]',
      heightClass: 'h-[78px]',
      titleClass: 'text-[44px]',
      iconWrap: 'h-11 w-11',
      iconSize: 24,
    },
  };

  if (tone === 'light') {
    return (
      <Link
        href="/"
        className={`inline-flex items-center gap-2 hover:opacity-90 transition-opacity ${className}`}
      >
        <span className={`inline-flex items-center justify-center rounded-full bg-white/10 border border-white/20 ${sizeClasses[size].iconWrap}`}>
          <Globe size={sizeClasses[size].iconSize} className="text-sky-300" />
        </span>
        <span className={`font-extrabold tracking-tight leading-none ${sizeClasses[size].titleClass}`}>
          <span className="text-cyan-300">GlobalMarket</span>
          <span className="text-amber-300">Hub</span>
        </span>
      </Link>
    );
  }

  return (
    <Link 
      href="/" 
      className={`inline-flex items-center hover:opacity-90 transition-opacity ${className}`}
    >
      <span className={`relative ${sizeClasses[size].widthClass} ${sizeClasses[size].heightClass}`}>
        <Image
          src="/logo.png"
          alt="GlobalMarketHub"
          fill
          sizes="260px"
          className="object-contain"
          priority={size === 'lg'}
        />
      </span>
    </Link>
  );
}
