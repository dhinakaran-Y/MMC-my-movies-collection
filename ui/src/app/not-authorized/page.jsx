import Link from "next/link";

export default function NotAuthorizedPage() {
  return (
    <div className="text-center mt-20">
      <h1 className="text-4xl font-bold text-gray-800">Not Authorized</h1>
      <p className="mt-4 text-gray-600">
        You do not have permission to access this page.
      </p>
      <Link href="/" className="text-brand hover:underline">
        Click here to redirect to homepage
      </Link>
    </div>
  );
}
