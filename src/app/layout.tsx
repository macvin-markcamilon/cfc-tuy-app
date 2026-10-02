import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
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
  title: "Couples For Christ - Tuy Chapter | Batangas",
  description:
    "Official community portal for Couples For Christ (CFC) Tuy Chapter, Batangas. Find households, Christian Life Program (CLP) schedules, family ministries, and prayer intentions.",
  keywords: [
    "Couples For Christ",
    "CFC Tuy",
    "Tuy Batangas",
    "Christian Life Program",
    "Singles for Christ",
    "Youth for Christ",
    "Kids for Christ",
    "Handmaids of the Lord",
    "Servants of the Lord",
    "San Nicolas de Tolentino Parish Tuy",
  ],
  authors: [{ name: "CFC Tuy Chapter Secretariat" }],
  openGraph: {
    title: "Couples For Christ - Tuy Chapter | Batangas",
    description:
      "Families in the Holy Spirit Renewing the Face of the Earth. Find local households, events, and community in Tuy, Batangas.",
    type: "website",
    locale: "en_PH",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-amber-400 selection:text-slate-950">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
