import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <SignUp 
        appearance={{
          elements: {
            formButtonPrimary: "bg-red-600 hover:bg-red-700",
          },
        }}
      />
    </div>
  );
}

