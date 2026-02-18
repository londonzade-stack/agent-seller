import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://emailligence.ai'),
  title: "Emailligence - Email AI Intelligence",
  description: "Agents / Email Organization / Automation / Cold Outreach — Search, draft, organize, and analyze your email with 30+ AI-powered tools.",
  openGraph: {
    title: 'Emailligence - Email AI Intelligence',
    description: 'Agents / Email Organization / Automation / Cold Outreach',
    siteName: 'Emailligence',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Emailligence - Email AI Intelligence',
    description: 'Agents / Email Organization / Automation / Cold Outreach',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
