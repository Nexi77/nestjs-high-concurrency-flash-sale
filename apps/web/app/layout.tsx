import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Flash Sale Lab',
    template: '%s | Flash Sale Lab',
  },
  description:
    'High-concurrency ticket reservation frontend built with Next.js, guest checkout, and live order status updates over SSE.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
