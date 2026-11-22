import Image from 'next/image';
import { cn } from '@/lib/cn';

type BrandLogoProps = {
  /** `small` es el símbolo; `full` incluye el texto de la marca. */
  variant?: 'small' | 'full';
  /** Versión blanca para fondos oscuros. */
  inverted?: boolean;
  className?: string;
  priority?: boolean;
  alt?: string;
};

const ASSETS = {
  small: {
    src: '/logo.png',
    invertedSrc: '/logo-white.png',
    width: 512,
    height: 512,
  },
  full: {
    src: '/logo-full.png',
    invertedSrc: '/logo-full-white.png',
    width: 1024,
    height: 362,
  },
} as const;

/** Marca de Opria: símbolo para espacios chicos y logo completo para headers. */
export function BrandLogo({
  variant = 'small',
  inverted = false,
  className,
  priority = false,
  alt = 'Opria',
}: BrandLogoProps) {
  const asset = ASSETS[variant];

  return (
    <Image
      src={inverted ? asset.invertedSrc : asset.src}
      alt={alt}
      width={asset.width}
      height={asset.height}
      priority={priority}
      className={cn('h-full w-auto object-contain', className)}
    />
  );
}
