import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { PlayerProvider } from "@/context/PlayerContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Melody",
  description: "Stream your favorite music",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SubscriptionProvider>
          <PlayerProvider>{children}</PlayerProvider>
        </SubscriptionProvider>
      </body>
    </html>
  );
}
