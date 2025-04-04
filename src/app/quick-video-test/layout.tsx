export default function QuickVideoTestLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="container mx-auto py-6">
      {children}
    </div>
  );
} 