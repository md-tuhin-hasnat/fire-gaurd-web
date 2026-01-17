import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import DeviceRegistrationForm from "@/components/company/device-registration-form";

export default async function DeviceRegistrationPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "company_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Device Registration</h1>
        <p className="text-muted-foreground">
          Register new IoT fire detection devices
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Register Device</CardTitle>
          <CardDescription>
            Enter the device ID and activation key provided by the administrator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeviceRegistrationForm />
        </CardContent>
      </Card>
    </div>
  );
}
