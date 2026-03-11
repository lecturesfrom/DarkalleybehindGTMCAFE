import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Dark Alley Behind GTM Cafe",
  description: "Member-only referral link router for GTM Cafe community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0A0A0F] text-[#F0F0F5] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
