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
      {/* Simple Header - Responsive */}
      <header className="p-4 sm:p-6">
        <div className="flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
          <span className="text-lg sm:text-xl font-bold">AlertRun</span>
        </div>
      </header>

      {/* Main Content - Responsive */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8 sm:space-y-12 max-w-sm sm:max-w-md lg:max-w-lg w-full">
          {/* Story - Responsive Text */}
          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              One Tap.
              <br />
              Everyone Alerted.
            </h1>
            <p className="text-slate-300 text-base sm:text-lg lg:text-xl leading-relaxed px-2">
              See a fire? Tap once. Everyone nearby gets an instant alert.
            </p>
          </div>

          {/* Single CTA - Responsive */}
          <div>
            <Button
              size="lg"
              className="w-full bg-red-600 hover:bg-red-700 text-white text-lg sm:text-xl lg:text-2xl py-5 sm:py-6 lg:py-7 px-6 sm:px-8 lg:px-10 rounded-xl sm:rounded-2xl shadow-2xl"
              asChild
            >
              <a href="/sign-up" className="block">
                Get Started
              </a>
            </Button>
            <p className="text-xs sm:text-sm text-slate-500 mt-3 sm:mt-4">
              <a href="/sign-in" className="underline">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
