import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import SystemOverview from "@/components/admin/system-overview";
import DeviceGenerator from "@/components/admin/device-generator";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {session.user.name}
          </p>
        </div>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Monitor the entire FireGuard system</CardDescription>
        </CardHeader>
        <CardContent>
          <SystemOverview />
        </CardContent>
      </Card>

      {/* Device Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Device ID Generator</CardTitle>
          <CardDescription>Generate new device IDs and activation keys</CardDescription>
        </CardHeader>
        <CardContent>
          <DeviceGenerator />
        </CardContent>
      </Card>
    </div>
  );
}
