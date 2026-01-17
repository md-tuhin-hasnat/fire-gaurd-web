import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlameIcon, AlertTriangleIcon, MapPinIcon, ShieldCheckIcon } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-orange-50 to-white py-20">
        <div className="container mx-auto px-6 text-center">
          <FlameIcon className="h-16 w-16 mx-auto text-orange-500 mb-6" />
          <h1 className="text-5xl font-bold mb-4">FireGuard</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Real-time IoT fire detection and alert management system with intelligent routing and multi-tenant support
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/simulator">
              <Button variant="outline" size="lg">Try Simulator</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <AlertTriangleIcon className="h-10 w-10 text-orange-500 mb-4" />
                <CardTitle>Real-time Detection</CardTitle>
                <CardDescription>
                  IoT sensors continuously monitor temperature, smoke, gas, and flame levels with MQTT protocol
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MapPinIcon className="h-10 w-10 text-orange-500 mb-4" />
                <CardTitle>Smart Routing</CardTitle>
                <CardDescription>
                  Automatic fire service dispatch with optimal route calculation and traffic police coordination
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <ShieldCheckIcon className="h-10 w-10 text-orange-500 mb-4" />
                <CardTitle>Multi-tenant</CardTitle>
                <CardDescription>
                  Separate dashboards for companies, fire services, and administrators with role-based access
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <FlameIcon className="h-10 w-10 text-orange-500 mb-4" />
                <CardTitle>Alert Management</CardTitle>
                <CardDescription>
                  Configurable escalation policies, SMS notifications, and real-time status tracking
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-orange-50 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex gap-4 items-start">
              <div className="bg-orange-500 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold mb-2">IoT Devices Monitor</h3>
                <p className="text-muted-foreground">
                  Edge devices continuously monitor environmental conditions and publish sensor data via MQTT every 5 minutes
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-orange-500 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold mb-2">Fire Detection</h3>
                <p className="text-muted-foreground">
                  System calculates danger levels based on temperature, smoke, gas, and flame readings. Alerts are triggered when danger exceeds 40%
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-orange-500 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold mb-2">Automatic Dispatch</h3>
                <p className="text-muted-foreground">
                  Nearest fire station is notified with precise location and sensor data. Traffic police receive route information via SMS
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-orange-500 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-bold mb-2">Response & Resolution</h3>
                <p className="text-muted-foreground">
                  Fire service accepts the alert, navigates to the location, and updates status in real-time until the incident is resolved
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Protect Your Assets?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join FireGuard today and experience next-generation fire detection and emergency response
          </p>
          <Link href="/login">
            <Button size="lg">Start Now</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <FlameIcon className="h-8 w-8 mx-auto mb-4" />
          <p className="text-sm text-neutral-400">
            © 2024 FireGuard. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

