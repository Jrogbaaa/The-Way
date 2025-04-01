import { ReactNode } from 'react';

export default function ModelsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">AI Model Testing</h1>
      {children}
    </div>
  );
} 