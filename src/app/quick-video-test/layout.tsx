import MainLayout from '@/components/layout/MainLayout';

export default function QuickVideoTestLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MainLayout>{children}</MainLayout>;
} 