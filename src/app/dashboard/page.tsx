import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function Dashboard() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="bg-slate-900/50 backdrop-blur p-4 sticky top-0 z-50">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <span className="text-lg font-bold">Emergency App</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost">
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Welcome Section */}
        <section>
          <h1 className="text-2xl font-bold mb-2">
            Welcome back, {user.firstName || "User"}!
          </h1>
          <p className="text-slate-400 text-sm">
            Manage your emergencies and stay informed
          </p>
        </section>

        {/* Quick Actions */}
        <section>
          <Button size="lg" className="w-full bg-red-600 hover:bg-red-700" asChild>
            <a href="#">
              <Plus className="w-5 h-5" />
              Report Emergency
            </a>
          </Button>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-2 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Active</CardDescription>
              <CardTitle className="text-2xl">0</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400">Resolved</CardDescription>
              <CardTitle className="text-2xl">0</CardTitle>
            </CardHeader>
          </Card>
        </section>

        {/* Recent Emergencies */}
        <section>
          <h2 className="text-xl font-bold mb-4">Recent Emergencies</h2>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-center text-sm">
                No emergencies reported yet
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

