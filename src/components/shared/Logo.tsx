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
      widthClass: 'w-[130px]',
      heightClass: 'h-[32px]',
      scaleClass: 'scale-[2.05]',
    },
    md: {
      widthClass: 'w-[158px]',
      heightClass: 'h-[38px]',
      scaleClass: 'scale-[2.1]',
    },
    lg: {
      widthClass: 'w-[192px]',
      heightClass: 'h-[46px]',
      scaleClass: 'scale-[2.15]',
    },
  };

  const themeClasses =
    tone === 'light'
      ? {
          imageWrap: 'brightness-0 invert drop-shadow-[0_1px_2px_rgba(255,255,255,0.25)]',
        }
      : {
          imageWrap: '',
        };

  return (
    <Link 
      href="/" 
      className={`inline-flex items-center hover:opacity-90 transition-opacity ${className}`}
    >
      <span className={`relative overflow-hidden ${sizeClasses[size].widthClass} ${sizeClasses[size].heightClass}`}>
        <Image
          src="/logo.png"
          alt="GlobalMarketHub"
          fill
          sizes="220px"
          className={`object-contain ${sizeClasses[size].scaleClass} ${themeClasses.imageWrap}`}
          priority={size === 'lg'}
        />
      </span>
    </Link>
  );
}
