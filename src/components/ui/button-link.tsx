import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}

/**
 * ButtonLink component specifically designed for Sign In/Sign Up buttons
 * with no outlines and full-area clickability
 */
export function ButtonLink({
  href,
  children,
  className,
  variant = 'primary',
  ...props
}: ButtonLinkProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors no-underline focus:ring-0 focus:outline-none whitespace-nowrap w-full";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 px-4 py-2 min-w-[100px]",
    secondary: "bg-white text-gray-900 hover:bg-gray-100 border border-gray-300 px-4 py-2 min-w-[100px]",
    ghost: "bg-transparent text-gray-900 hover:bg-gray-100 px-4 py-2 min-w-[100px]"
  };

  return (
    <Link 
      href={href}
      className={cn(baseClasses, variantClasses[variant], className)}
      tabIndex={0}
      aria-label={typeof children === 'string' ? children : undefined}
      style={{ 
        textDecoration: 'none', 
        outline: 'none', 
        border: 'none',
        whiteSpace: 'nowrap',
        boxShadow: 'none'
      }}
      {...props}
    >
      {children}
    </Link>
  );
}

export default ButtonLink; 