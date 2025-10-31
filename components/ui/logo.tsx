import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'full' | 'icon' | 'compact'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
  href?: string
  clickable?: boolean
}

const sizeMap = {
  sm: { width: 32, height: 32 },
  md: { width: 40, height: 40 },
  lg: { width: 48, height: 48 },
  xl: { width: 120, height: 120 },
}

/**
 * Company logo component with multiple size and variant options
 *
 * @example
 * // Full logo in sidebar
 * <Logo size="md" variant="full" />
 *
 * @example
 * // Icon only for mobile
 * <Logo size="sm" variant="icon" showText={false} />
 *
 * @example
 * // Large logo on login page
 * <Logo size="xl" variant="full" showText={true} clickable={false} />
 */
export function Logo({
  variant = 'full',
  size = 'md',
  className,
  showText = false,
  href = '/dashboard',
  clickable = true,
}: LogoProps) {
  const dimensions = sizeMap[size]

  const logoSrc = '/images/logos/bit2bit-logo.jpg'

  const logoElement = (
    <div className={cn('flex items-center gap-3', className)}>
      <Image
        src={logoSrc}
        alt="bit2bit Logo"
        width={dimensions.width}
        height={dimensions.height}
        priority
        className="object-contain"
      />
      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight">BMS Dashboard</span>
          <span className="text-xs text-muted-foreground">by bit2bit</span>
        </div>
      )}
    </div>
  )

  if (clickable) {
    return (
      <Link
        href={href}
        className="transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
        aria-label="Go to dashboard home"
      >
        {logoElement}
      </Link>
    )
  }

  return logoElement
}
