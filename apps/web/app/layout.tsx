import type { Metadata } from "next";

import "./global.css";
import { AppSidebar } from "./components/app-sidebar";

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
        <div className="flex h-screen overflow-hidden">
          <AppSidebar />
          <main className="flex flex-1 flex-col overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
