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
    },
    md: {
      widthClass: 'w-[158px]',
      heightClass: 'h-[38px]',
    },
    lg: {
      widthClass: 'w-[192px]',
      heightClass: 'h-[46px]',
    },
  };

  const themeClasses =
    tone === 'light'
      ? {
          imageWrap: 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]',
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
          className={`object-contain scale-[1.45] ${themeClasses.imageWrap}`}
          priority={size === 'lg'}
        />
      </span>
    </Link>
  );
}
