import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { SetupGuard } from "@/components/setup-guard";

export const metadata: Metadata = {
  title: "Plex Wrapped",
  description: "Your Plex media statistics",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SetupGuard>
            {children}
          </SetupGuard>
        </Providers>
      </body>
    </html>
  );
}

