import type { Metadata } from "next";
import { SessionProvider } from '@/components/providers/SessionProvider';
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Shoey - Team Sports Management",
  description: "Manage your team, track scores, and view leaderboards. Victory tastes better from the boot! 🥾",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.ico'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
