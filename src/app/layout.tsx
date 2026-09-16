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
    default: "Check Your Roof for Solar | Free Consult | Solar Entry",
    template: "%s | Solar Entry",
  },
  description:
    "Free satellite screening shows if your roof is fit for solar. See results for your home, then book a free consultation. Call Solar Entry: 203-818-3242.",
  metadataBase: new URL("https://solarentry.com"),
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "Check Your Roof for Solar | Free Consult | Solar Entry",
    description:
      "Free satellite screening shows if your roof is fit for solar. See results for your home, then book a free consultation. Call Solar Entry: 203-818-3242.",
    url: "https://solarentry.com",
    siteName: "Solar Entry",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Check Your Roof for Solar | Free Consult | Solar Entry",
    description:
      "Free satellite screening shows if your roof is fit for solar. See results for your home, then book a free consultation. Call Solar Entry: 203-818-3242.",
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
        <main className="relative flex-1 px-4 py-8 sm:px-6 sm:py-14">
          <div className="site-solar-bg" aria-hidden="true" />
          <div className="relative z-10">{children}</div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
