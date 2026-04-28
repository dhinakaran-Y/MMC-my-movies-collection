import RegisterDiv from "./RegisterDiv";

export const metadata = {
  title: "Register",
  description: "User Register Account page.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-dark-body1 px-4 py-10 relative overflow-hidden">
      <RegisterDiv/>
    </div>
  );
}
