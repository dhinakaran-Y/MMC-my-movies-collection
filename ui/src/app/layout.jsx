import { Ubuntu, Oswald, Inter } from "next/font/google";
import "./globals.css";
import AuthContextProvider from "@/components/context/AuthContextProvider";

const ubuntu = Ubuntu({
  weight: ["400", "300", "500", "700"],
  subsets: ["latin"],
});

const oswald = Oswald({
  weight: ["200", "300", "400", "500", "600", "700"],
  subsets: ["cyrillic-ext"],
});

const inter = Inter({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "MMC | MMC",
    template: "%s | MMC",
  },
  description:
    "My Movies Collection, A Digital Movies Library are Movies watch list storing website.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`h-full antialiased dark`}>
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <AuthContextProvider>{children}</AuthContextProvider>
      </body>
    </html>
  );
}
