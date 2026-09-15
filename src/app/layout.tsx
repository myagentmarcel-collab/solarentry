import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Solar Entry — Check your roof for solar",
    template: "%s | Solar Entry",
  },
  description:
    "Free residential solar screening for Connecticut and US homeowners. Satellite-based roof check via Google Solar API. Call 203-818-3242.",
  metadataBase: new URL("https://solarentry.com"),
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
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
        className={`${plusJakarta.variable} flex min-h-screen flex-col bg-background font-sans text-foreground antialiased`}
      >
        <Header />
        <main className="relative flex-1 px-4 py-10 sm:px-6 sm:py-16">
          <div className="site-solar-bg" aria-hidden="true" />
          <div className="relative z-10">{children}</div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
