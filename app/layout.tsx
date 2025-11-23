import type { Metadata } from "next";
import { Inter } from "next/font/google"; // 1. Import Google Font
import "./globals.css";

// 2. Setup the font
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dialect",
  description: "The future of social connection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning={true}
        // 3. Use the font class here
        className={`${inter.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}