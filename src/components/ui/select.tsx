import React from 'react';

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Select({ children, value, onValueChange, className = '' }: SelectProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
    </div>
  );
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectTrigger({ children, className = '' }: SelectTriggerProps) {
  return (
    <div className={`flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ml-2 h-4 w-4 opacity-50"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  return <span className="text-sm">{placeholder}</span>;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectContent({ children, className = '' }: SelectContentProps) {
  return (
    <div className={`relative mt-1 max-h-60 min-w-[8rem] overflow-hidden rounded-md border border-input bg-background p-1 text-popover-foreground shadow-md z-50 ${className}`}>
      <div className="max-h-[200px] overflow-y-auto">{children}</div>
    </div>
  );
}

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export function SelectItem({ children, value, className = '' }: SelectItemProps) {
  return (
    <div
      data-value={value}
      className={`relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground ${className}`}
    >
      {children}
    </div>
  );
} 