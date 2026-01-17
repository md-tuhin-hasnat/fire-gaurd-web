"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AlertDetailsProps {
  alert: any;
}

export default function AlertDetails({ alert }: AlertDetailsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/alerts/${alert._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(`Status updated to ${status.replace("_", " ")}`);
        router.refresh();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "destructive";
      case "accepted":
        return "outline";
      case "en_route":
        return "default";
      case "arrived":
        return "default";
      case "resolved":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Alert Information</CardTitle>
          <CardDescription>Fire incident details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={getStatusColor(alert.status)}>
              {alert.status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Danger Level</p>
            <div className="flex items-center gap-2">
              <Badge variant={alert.dangerLevel >= 70 ? "destructive" : "outline"}>
                {alert.dangerLevel}%
              </Badge>
              <span className="text-sm">
                {alert.dangerLevel >= 70 ? "Critical" : "Warning"}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Device</p>
            <p className="font-medium">{alert.device?.name || alert.deviceId}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Company</p>
            <p className="font-medium">{alert.company?.name}</p>
            <p className="text-sm">{alert.company?.phone}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Location</p>
            <p className="text-sm">
              {alert.device?.location?.address || "Address not available"}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Created At</p>
            <p className="text-sm">
              {new Date(alert.createdAt).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sensor Readings</CardTitle>
          <CardDescription>Data from fire detection sensors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Temperature:</span>
            <span className="font-medium">{alert.sensorData.temperature}°C</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Smoke:</span>
            <span className="font-medium">{alert.sensorData.smoke}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Gas:</span>
            <span className="font-medium">{alert.sensorData.gas}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Flame:</span>
            <Badge variant={alert.sensorData.flame ? "destructive" : "secondary"}>
              {alert.sensorData.flame ? "Detected" : "Not Detected"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Update incident status</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {alert.status === "accepted" && (
            <Button
              onClick={() => updateStatus("en_route")}
              disabled={loading}
            >
              Mark En Route
            </Button>
          )}
          {alert.status === "en_route" && (
            <Button
              onClick={() => updateStatus("arrived")}
              disabled={loading}
            >
              Mark Arrived
            </Button>
          )}
          {alert.status === "arrived" && (
            <>
              <Button
                onClick={() => updateStatus("resolved")}
                disabled={loading}
              >
                Mark Resolved
              </Button>
              <Button
                variant="outline"
                onClick={() => updateStatus("false_alarm")}
                disabled={loading}
              >
                False Alarm
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
