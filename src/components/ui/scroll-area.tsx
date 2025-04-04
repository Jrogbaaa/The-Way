import React from "react";

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollArea({ children, className = "" }: ScrollAreaProps) {
  return (
    <div className={`relative overflow-auto ${className}`}>
      {children}
    </div>
  );
} 