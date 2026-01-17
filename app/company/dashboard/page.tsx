import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import DeviceList from "@/components/company/device-list";
import FireEventLog from "@/components/company/fire-event-log";
import LiveFireStatus from "@/components/company/live-fire-status";

export default async function CompanyDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "company_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Company Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {session.user.name}
          </p>
        </div>
      </div>

      {/* Live Fire Situation */}
      <Card>
        <CardHeader>
          <CardTitle>🔥 Live Fire Situation & Occupancy</CardTitle>
          <CardDescription>Real-time fire detection and human count across all locations</CardDescription>
        </CardHeader>
        <CardContent>
          <LiveFireStatus />
        </CardContent>
      </Card>

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Devices</CardTitle>
          <CardDescription>Monitor your IoT fire detection devices</CardDescription>
        </CardHeader>
        <CardContent>
          <DeviceList />
        </CardContent>
      </Card>

      {/* Fire Event History */}
      <Card>
        <CardHeader>
          <CardTitle>Fire Event History</CardTitle>
          <CardDescription>Complete log of all fire detection events</CardDescription>
        </CardHeader>
        <CardContent>
          <FireEventLog />
        </CardContent>
      </Card>
    </div>
  );
}
