import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-12',
    md: 'h-20',
    lg: 'h-24',
  };

  return (
    <Link 
      href="/" 
      className={`flex items-center hover:opacity-90 transition-opacity ${className}`}
    >
      {/* Logo Image */}
      <Image
        src="/logo.png"
        alt="GlobalMarketHub"
        width={800}
        height={300}
        className={`${sizeClasses[size]} w-auto`}
        priority
      />
    </Link>
  );
}
