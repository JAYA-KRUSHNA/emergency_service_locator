import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Emergency Service Locator — Find Nearby Emergency Services",
  description:
    "Quickly find nearby hospitals, police stations, fire stations, ambulance services, pharmacies, and more. Get directions and navigate to the nearest emergency service.",
  keywords: [
    "emergency services",
    "hospital finder",
    "police station",
    "fire station",
    "ambulance",
    "pharmacy",
    "emergency locator",
    "navigation",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
