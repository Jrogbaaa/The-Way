import MainLayout from '@/components/layout/MainLayout';

export default function LongformVideoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MainLayout>{children}</MainLayout>;
} 