import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CompanyRegistrationForm from "@/components/company-registration-form";
import Link from "next/link";

export default function CompanyRegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Register Your Company</CardTitle>
          <CardDescription>
            Join FireGuard IoT Fire Detection System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyRegistrationForm />
          <div className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-orange-500 hover:underline">
              Login here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
