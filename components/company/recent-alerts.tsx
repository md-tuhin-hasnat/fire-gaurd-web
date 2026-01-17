"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Alert {
  _id: string;
  deviceId: string;
  device?: {
    deviceId: string;
    name: string;
  };
  dangerLevel: number;
  sensorData: {
    temperature: number;
    smoke: number;
    gas: number;
    flame: boolean;
  };
  status: string;
  createdAt: string;
}

export default function RecentAlerts() {
  const { data: session } = useSession();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchAlerts();
    }
  }, [session]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/alerts?limit=5");
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "outline";
      case "accepted":
        return "default";
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
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No recent alerts
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Device</TableHead>
          <TableHead>Danger Level</TableHead>
          <TableHead>Temperature</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alerts.map((alert) => (
          <TableRow key={alert._id}>
            <TableCell className="font-mono text-sm">
              {alert.device?.name || alert.deviceId}
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
            <TableCell>{new Date(alert.createdAt).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
