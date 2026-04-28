import LoginDiv from "./LoginDiv";

export const metadata = {
  title: "Login",
  description: "User Login page.",
};


export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-body1 px-4">
      <LoginDiv/>
    </div>
  );
}
