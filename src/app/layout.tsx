import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/providers/WalletProvider";
import { FarcasterMiniAppsProvider } from "@/components/providers/FarcasterMiniAppsProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://frevoke.vercel.app"
  ),
  title: "fRevoke - Token Approval Revoker",
  description:
    "Revoke token approvals on Base network. Secure your wallet by revoking unnecessary token permissions.",
  keywords: ["Base", "token approvals", "revoke", "ethereum", "security", "wallet", "token"],
  authors: [{ name: "fRevoke Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "fRevoke - Token Approval Revoker",
    description:
      "Revoke token approvals on Base network. Secure your wallet by revoking unnecessary token permissions.",
    type: "website",
    url: "https://frevoke.vercel.app",
    images: [
      {
        url: "https://frevoke.vercel.app/logo.png",
        width: 512,
        height: 512,
        alt: "fRevoke",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "fRevoke - Token Approval Revoker",
    description:
      "Revoke token approvals on Base network. Secure your wallet by revoking unnecessary token permissions.",
    images: ["https://frevoke.vercel.app/logo.png"],
  },
  other: {
    "fc:miniapp": JSON.stringify({
      version: "next",
      imageUrl: "https://frevoke.vercel.app/logo.png",
      button: {
        title: "Revoke Tokens",
        action: {
          type: "launch_miniapp",
          name: "fRevoke",
          url: "https://frevoke.vercel.app",
          splashImageUrl: "https://frevoke.vercel.app/logo.png",
          splashBackgroundColor: "#6F3CC2"
        }
      }
    })
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0ea5e9",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <WalletProvider>
          {/* Farcaster Mini Apps readiness handshake */}
          <FarcasterMiniAppsProvider />
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}