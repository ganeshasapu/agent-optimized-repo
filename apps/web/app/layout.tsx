import type { Metadata } from "next";

import "./global.css";

export const metadata: Metadata = {
  title: "Biarritz",
  description: "Agent-optimized application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
