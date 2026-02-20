import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'Interview Assistant | Ethical Career Prep Tool',
  description:
    'Prepare for interviews with AI-powered practice, real-time feedback, and structured guides. Ethical tool for candidates and career growth.',
  openGraph: {
    title: 'Interview Assistant | Ethical Career Prep Tool',
    description: 'Prepare for interviews with AI-powered practice and real-time feedback.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
