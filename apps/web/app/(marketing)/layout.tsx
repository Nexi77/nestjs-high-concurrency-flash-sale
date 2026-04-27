import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flash Sale - Marketing',
  description: 'Flash sale frontend application - marketing section',
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <section>{children}</section>;
}
