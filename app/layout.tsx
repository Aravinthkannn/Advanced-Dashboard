import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Advanced CRM Dashboard",
  description: "Customer management dashboard with advanced filtering and drag-and-drop."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body><Providers>{children}</Providers></body></html>;
}
