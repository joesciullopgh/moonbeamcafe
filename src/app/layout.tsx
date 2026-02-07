import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthProvider from "@/components/AuthProvider";
import StoreSettingsLoader from "@/components/StoreSettingsLoader";

export const metadata: Metadata = {
  title: "Moonbeam Cafe | Pittsburgh Coffee Shop",
  description: "Your neighborhood coffee shop at 4621 Liberty Avenue, Pittsburgh. Handcrafted drinks, fresh food, and a warm atmosphere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <StoreSettingsLoader />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
