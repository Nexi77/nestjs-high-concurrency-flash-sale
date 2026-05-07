import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Event',
  description: 'Public event landing page for the Flash Sale Lab checkout flow.',
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <section className="marketing-layout">{children}</section>;
}
