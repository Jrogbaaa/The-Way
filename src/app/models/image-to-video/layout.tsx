import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Image to Video Conversion | The Way',
  description: 'Convert still images into high-quality videos with motion using AI',
};

export default function ImageToVideoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 