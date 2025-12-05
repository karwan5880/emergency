import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default async function Home() {
  const user = await currentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      {/* Simple Header */}
      <header className="p-6">
        <div className="flex items-center justify-center gap-2">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <span className="text-2xl font-bold">Emergency App</span>
        </div>
      </header>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-8 max-w-md w-full">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Emergency Response
            </h1>
            <p className="text-slate-400 text-lg">
              Report emergencies quickly and securely
            </p>
          </div>

          {/* Big Centered Button */}
          <div className="space-y-4">
            <Button 
              size="lg" 
              className="w-full max-w-xs mx-auto bg-red-600 hover:bg-red-700 text-white text-lg py-8 px-12 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105" 
              asChild
            >
              <a href="/sign-up" className="flex items-center justify-center gap-3">
                <AlertCircle className="w-6 h-6" />
                Get Started
              </a>
            </Button>
            
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <a href="/sign-in" className="text-red-400 hover:text-red-300 underline">
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="p-6 text-center text-xs text-slate-500">
        <p>&copy; 2024 Emergency App. All rights reserved.</p>
      </footer>
    </main>
  );
}

