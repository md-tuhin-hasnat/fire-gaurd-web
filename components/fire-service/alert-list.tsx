"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { EyeIcon } from "lucide-react";

interface Alert {
  _id: string;
  deviceId: string;
  device?: {
    deviceId: string;
    name: string;
    location: {
      coordinates: [number, number];
      address?: string;
    };
  };
  company?: {
    name: string;
    phone: string;
  };
  dangerLevel: number;
  sensorData: {
    temperature: number;
    smoke: number;
    gas: number;
    flame: boolean;
  };
  status: string;
  acceptedBy?: string;
  createdAt: string;
}

export default function AlertList() {
  const { data: session } = useSession();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchAlerts();
      // Poll for new alerts every 10 seconds
      const interval = setInterval(fetchAlerts, 10000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/alerts");
      console.log('Fetch alerts response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetch alerts data:', data);
        setAlerts(data.alerts || []);
      } else {
        console.error('Fetch alerts failed:', response.status, await response.text());
        setAlerts([]);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (alertId: string) => {
    setActionLoading(alertId);
    try {
      const response = await fetch(`/api/alerts/${alertId}/accept`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Alert accepted successfully");
        fetchAlerts();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to accept alert");
      }
    } catch (error) {
      toast.error("Failed to accept alert");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusUpdate = async (alertId: string, status: string) => {
    setActionLoading(alertId);
    try {
      const response = await fetch(`/api/alerts/${alertId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(`Status updated to ${status.replace("_", " ")}`);
        fetchAlerts();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setActionLoading(null);
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
      case "false_alarm":
        return "secondary";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No alerts available
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Device</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Danger</TableHead>
          <TableHead>Temp</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alerts.map((alert) => (
          <TableRow key={alert._id}>
            <TableCell className="font-mono text-sm">
              {alert.device?.name || alert.deviceId}
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{alert.company?.name}</span>
                <span className="text-xs text-muted-foreground">{alert.company?.phone}</span>
              </div>
            </TableCell>
            <TableCell className="max-w-xs truncate">
              {alert.device?.location.address || 
               `${alert.device?.location.coordinates[1]}, ${alert.device?.location.coordinates[0]}`}
            </TableCell>
            <TableCell>
              <Badge variant={alert.dangerLevel >= 70 ? "destructive" : "outline"}>
                {alert.dangerLevel}%
              </Badge>
            </TableCell>
            <TableCell>{alert.sensorData.temperature}°C</TableCell>
            <TableCell>
              <Badge variant={getStatusColor(alert.status)}>
                {alert.status.replace("_", " ").toUpperCase()}
              </Badge>
            </TableCell>
            <TableCell className="text-sm">
              {new Date(alert.createdAt).toLocaleTimeString()}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push(`/fire-service/alerts/${alert._id}`)}
                  title="View Details"
                >
                  <EyeIcon className="h-4 w-4" />
                </Button>
                {alert.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => handleAccept(alert._id)}
                    disabled={actionLoading === alert._id}
                  >
                    Accept
                  </Button>
                )}
                {alert.status === "accepted" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(alert._id, "en_route")}
                    disabled={actionLoading === alert._id}
                  >
                    En Route
                  </Button>
                )}
                {alert.status === "en_route" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(alert._id, "arrived")}
                    disabled={actionLoading === alert._id}
                  >
                    Arrived
                  </Button>
                )}
                {alert.status === "arrived" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(alert._id, "resolved")}
                    disabled={actionLoading === alert._id}
                  >
                    Resolve
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
