import MainLayout from '@/components/layout/MainLayout';

export const metadata = {
  title: 'Posts - The Way',
  description: 'Upload and manage your social media posts',
};

export default function PostsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
} 