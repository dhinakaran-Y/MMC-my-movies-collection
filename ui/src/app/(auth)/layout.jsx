export const metadata = {
  title: {
    default: "Login",
    template: "%s | MMC",
  },
  description: "this page is the home page of MMC",
};

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-dark-body1 flex items-center justify-center">
      {children}
    </div>
  );
}
