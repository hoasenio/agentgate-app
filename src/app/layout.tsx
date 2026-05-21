import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import type { ReactNode } from "react";
import agentGateLogo from "@/assets/AgentGate-logo.png";
import openGraphImage from "@/assets/opengraph.png";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "AgentGate",
  description:
    "Privacy-preserving AI governance layer for autonomous agents.",
  icons: {
    icon: [{ url: agentGateLogo.src, type: "image/png" }],
    shortcut: [{ url: agentGateLogo.src, type: "image/png" }],
    apple: [{ url: agentGateLogo.src, type: "image/png" }],
  },
  openGraph: {
    title: "AgentGate",
    description:
      "Privacy-preserving AI governance layer for autonomous agents.",
    type: "website",
    images: [
      {
        url: openGraphImage.src,
        width: 1024,
        height: 1024,
        alt: "AgentGate Open Graph image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentGate",
    description:
      "Privacy-preserving AI governance layer for autonomous agents.",
    images: [openGraphImage.src],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${jetbrainsMono.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
