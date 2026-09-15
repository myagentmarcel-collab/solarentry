import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
  title: {
    default: "Solar Entry — Check your roof for solar",
    template: "%s | Solar Entry",
  },
  description:
    "Free residential solar screening for Connecticut and US homeowners. Satellite-based roof check via Google Solar API. Call 203-818-3242.",
  metadataBase: new URL("https://solarentry.com"),
  openGraph: {
    title: "Solar Entry — Check your roof for solar",
    description:
      "Clean, trustworthy solar screening for CT/US homeowners. Call 203-818-3242.",
    url: "https://solarentry.com",
    siteName: "Solar Entry",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col bg-background text-foreground antialiased`}
      >
        <Header />
        <main className="flex-1 px-4 py-10 sm:px-6 sm:py-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
