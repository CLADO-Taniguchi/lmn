
import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico, Playfair_Display } from "next/font/google";
import "./globals.css";

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pacifico',
})

const playfairDisplay = Playfair_Display({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair-display',
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Readdy Site",
  description: "Generated by Readdy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} ${playfairDisplay.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
