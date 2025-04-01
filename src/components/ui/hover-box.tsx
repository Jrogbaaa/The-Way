import React from 'react';
import { cn } from '@/lib/utils';

interface HoverBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'subtle' | 'default' | 'strong';
}

/**
 * HoverBox component adds consistent hover effects to any element
 * Use this to enhance clickable areas without modifying the element directly
 */
const HoverBox = React.forwardRef<HTMLDivElement, HoverBoxProps>(
  ({ children, className, disabled = false, variant = 'default', ...props }, ref) => {
    const hoverClasses = {
      subtle: 'hover:bg-gray-50 dark:hover:bg-gray-900',
      default: 'hover:bg-gray-100 hover:shadow-sm hover:ring-1 hover:ring-primary/20 dark:hover:bg-gray-800',
      strong: 'hover:shadow-md hover:ring-2 hover:ring-primary/30 dark:hover:ring-primary/20'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-md transition-all duration-200',
          !disabled && hoverClasses[variant],
          disabled && 'opacity-60 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

HoverBox.displayName = 'HoverBox';

export { HoverBox }; 