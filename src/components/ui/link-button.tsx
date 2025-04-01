import React from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { VariantProps } from 'class-variance-authority';

interface LinkButtonProps 
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof buttonVariants> {
  href: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/**
 * LinkButton component that combines Next.js Link with Button styling
 * This ensures the entire button area is clickable and styled correctly
 */
export function LinkButton({
  href,
  children,
  className,
  variant = 'default',
  size = 'default',
  ...props
}: LinkButtonProps) {
  return (
    <Link 
      href={href}
      className={cn(
        buttonVariants({ variant, size }),
        "no-underline outline-none focus:outline-none w-full",
        className
      )}
      tabIndex={0}
      aria-label={typeof children === 'string' ? children : undefined}
      style={{
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        textDecoration: 'none',
        borderRadius: 'var(--radius)',
        border: 'none',
        boxShadow: 'none'
      }}
      {...props}
    >
      {children}
    </Link>
  );
}

export default LinkButton; 