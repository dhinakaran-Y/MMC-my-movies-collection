// src/app/(main)/layout.js
import { CollectionModalProvider } from "@/components/context/CollectionModalContext";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export const metadata = {
  title: {
    default: "Home",
    template: "%s | MMC",
  },
  description: "this page is the home page of MMC",
};

export default function MainLayout({ children }) {
  return (
    <>
      <Header />
      <main className="flex-1">
        <CollectionModalProvider>{children}</CollectionModalProvider>
      </main>
      <Footer />
    </>
  );
}