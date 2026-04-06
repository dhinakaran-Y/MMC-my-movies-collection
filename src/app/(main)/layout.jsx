// src/app/(main)/layout.js
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
      <main className="flex-1">{children}</main>
    </>
  );
}