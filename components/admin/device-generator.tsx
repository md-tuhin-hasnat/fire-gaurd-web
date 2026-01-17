"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { CopyIcon } from "lucide-react";

interface GeneratedDevice {
  deviceId: string;
  activationKey: string;
}

export default function DeviceGenerator() {
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<GeneratedDevice[]>([]);

  const generateDevices = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/generate-devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });

      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices);
        toast.success(`Generated ${count} device${count > 1 ? "s" : ""}`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to generate devices");
      }
    } catch (error) {
      toast.error("Failed to generate devices");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const exportCSV = () => {
    const csv = [
      "Device ID,Activation Key",
      ...devices.map((d) => `${d.deviceId},${d.activationKey}`),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devices_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="count">Number of Devices</Label>
          <Input
            id="count"
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
          />
        </div>
        <Button onClick={generateDevices} disabled={loading}>
          {loading ? "Generating..." : "Generate"}
        </Button>
      </div>

      {devices.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Generated Devices ({devices.length})</h3>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              Export CSV
            </Button>
          </div>
          <div className="space-y-2 max-h-96 overflow-auto">
            {devices.map((device, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Device ID</Label>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">{device.deviceId}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(device.deviceId)}
                        >
                          <CopyIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Activation Key</Label>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">{device.activationKey}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(device.activationKey)}
                        >
                          <CopyIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
