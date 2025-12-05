import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <SignIn 
        appearance={{
          elements: {
            formButtonPrimary: "bg-red-600 hover:bg-red-700",
          },
        }}
      />
    </div>
  );
}

