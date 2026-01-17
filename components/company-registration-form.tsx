"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const COMPANY_TYPES = [
  { value: "garments", label: "Garments" },
  { value: "oil_gas", label: "Oil & Gas" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "warehouse", label: "Warehouse" },
  { value: "hospital", label: "Hospital" },
  { value: "hotel", label: "Hotel" },
  { value: "shopping_mall", label: "Shopping Mall" },
  { value: "office_building", label: "Office Building" },
  { value: "educational", label: "Educational" },
  { value: "other", label: "Other" },
];

export default function CompanyRegistrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    companyType: "garments",
    address: "",
    city: "",
    country: "Bangladesh",
    phone: "",
    email: "",
    latitude: "",
    longitude: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.adminPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.adminPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/companies/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.companyName,
          companyType: formData.companyType,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          contactPhone: formData.phone,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
        }),
      });

      if (response.ok) {
        toast.success("Company registered successfully! Please login.");
        router.push("/login");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to register company");
      }
    } catch (error) {
      toast.error("Failed to register company");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Company Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              name="companyName"
              placeholder="Acme Corporation"
              value={formData.companyName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyType">Company Type *</Label>
            <select
              id="companyType"
              name="companyType"
              value={formData.companyType}
              onChange={handleChange}
              className="flex h-8 w-full rounded-none border border-input bg-background px-2.5 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            >
              {COMPANY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1234567890"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="email">Company Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="contact@company.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              name="address"
              placeholder="123 Main St"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              name="city"
              placeholder="Dhaka"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              name="country"
              placeholder="Bangladesh"
              value={formData.country}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude *</Label>
            <Input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              placeholder="23.8103"
              value={formData.latitude}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude *</Label>
            <Input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              placeholder="90.4125"
              value={formData.longitude}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      {/* Admin User Information */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold text-lg">Admin User Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="adminName">Admin Name *</Label>
            <Input
              id="adminName"
              name="adminName"
              placeholder="John Doe"
              value={formData.adminName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="adminEmail">Admin Email *</Label>
            <Input
              id="adminEmail"
              name="adminEmail"
              type="email"
              placeholder="admin@company.com"
              value={formData.adminEmail}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminPassword">Password *</Label>
            <Input
              id="adminPassword"
              name="adminPassword"
              type="password"
              placeholder="Min. 6 characters"
              value={formData.adminPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Registering..." : "Register Company"}
      </Button>
    </form>
  );
}
