import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "訪問介護 サービス提供記録",
  description: "訪問介護サービス提供記録システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
