import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flash Sale - Checkout',
  description: 'Flash sale frontend application - checkout section',
};

export default function CheckoutLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <section>{children}</section>;
}
