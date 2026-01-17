"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function DeviceRegistrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    deviceId: "",
    activationKey: "",
    roomNo: "",
    floorNo: "",
    staticDangerLevel: "0",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      deviceId: formData.deviceId,
      activationKey: formData.activationKey,
      roomNo: formData.roomNo,
      floorNo: formData.floorNo,
      staticDangerLevel: parseFloat(formData.staticDangerLevel),
    };

    console.log("Submitting device registration:", payload);

    try {
      const response = await fetch("/api/devices/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Device registered successfully!");
        router.push("/company/dashboard");
      } else {
        const error = await response.json();
        console.error("Registration error:", error);
        if (error.details) {
          // Show Zod validation details
          console.error("Validation details:", error.details);
          error.details.forEach((detail: any) => {
            toast.error(`${detail.path.join('.')}: ${detail.message}`);
          });
        } else {
          toast.error(error.error || "Failed to register device");
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Failed to register device");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="deviceId">Device ID *</Label>
          <Input
            id="deviceId"
            name="deviceId"
            placeholder="FG-1234567890-ABCD1234"
            value={formData.deviceId}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="activationKey">Activation Key *</Label>
          <Input
            id="activationKey"
            name="activationKey"
            placeholder="ABCDEF1234567890"
            value={formData.activationKey}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="roomNo">Room Number *</Label>
          <Input
            id="roomNo"
            name="roomNo"
            placeholder="101"
            value={formData.roomNo}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="floorNo">Floor Number *</Label>
          <Input
            id="floorNo"
            name="floorNo"
            placeholder="1"
            value={formData.floorNo}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="staticDangerLevel">Static Danger Level (0-100) *</Label>
        <Input
          id="staticDangerLevel"
          name="staticDangerLevel"
          type="number"
          min="0"
          max="100"
          placeholder="0"
          value={formData.staticDangerLevel}
          onChange={handleChange}
          required
        />
        <p className="text-xs text-muted-foreground">
          Base danger level for this location (e.g., higher for chemical storage areas)
        </p>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register Device"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/company/dashboard")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
