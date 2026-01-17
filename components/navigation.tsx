"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { FlameIcon, HomeIcon, LogOutIcon, MenuIcon, PlusIcon, Settings2Icon } from "lucide-react";
import { useState } from "react";

export default function Navigation() {
  const { data: session } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!session) return null;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const getNavigationLinks = () => {
    switch (session.user.role) {
      case "company_admin":
        return [
          { href: "/company/dashboard", label: "Dashboard", icon: HomeIcon },
          { href: "/company/devices/register", label: "Register Device", icon: PlusIcon },
        ];
      case "fire_service":
        return [
          { href: "/fire-service/alerts", label: "Alerts", icon: HomeIcon },
        ];
      case "super_admin":
        return [
          { href: "/admin/dashboard", label: "Dashboard", icon: HomeIcon },
          { href: "/simulator", label: "Simulator", icon: Settings2Icon },
        ];
      default:
        return [];
    }
  };

  const links = getNavigationLinks();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <FlameIcon className="h-6 w-6 text-orange-500" />
            FireGuard
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 text-sm hover:text-orange-500 transition-colors"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium">{session.user.name}</span>
              <span className="text-xs text-muted-foreground">
                {session.user.role.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOutIcon className="h-5 w-5" />
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t">
            <div className="pb-2 mb-2 border-b">
              <p className="text-sm font-medium">{session.user.name}</p>
              <p className="text-xs text-muted-foreground">
                {session.user.role.replace("_", " ").toUpperCase()}
              </p>
            </div>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 py-2 text-sm hover:text-orange-500 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
