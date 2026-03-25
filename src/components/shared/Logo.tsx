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
      width: 150,
      height: 36,
    },
    md: {
      width: 175,
      height: 42,
    },
    lg: {
      width: 220,
      height: 52,
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
      className={`inline-flex items-center gap-2 hover:opacity-90 transition-opacity ${className}`}
    >
      <Image
        src="/logo.png"
        alt="GlobalMarketHub"
        width={sizeClasses[size].width}
        height={sizeClasses[size].height}
        className={`h-auto w-auto max-w-full object-contain ${themeClasses.imageWrap}`}
        priority={size === 'lg'}
      />
    </Link>
  );
}
