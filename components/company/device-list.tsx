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

interface Device {
  _id: string;
  deviceId: string;
  roomNo: string;
  floorNo: string;
  staticDangerLevel: number;
  status: string;
  lastSeenAt?: string;
  latestData?: {
    fireDetection: boolean;
    confidence: number;
    humanCount: number;
    dynamicDangerLevel: number;
    timestamp: string;
  };
}

export default function DeviceList() {
  const { data: session } = useSession();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchDevices();
    }
  }, [session]);

  const fetchDevices = async () => {
    try {
      const response = await fetch("/api/devices/list");
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      } else {
        setDevices([]);
      }
    } catch (error) {
      console.error("Failed to fetch devices:", error);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const getDangerLevelColor = (level: number) => {
    if (level >= 70) return "destructive";
    if (level >= 40) return "outline";
    return "secondary";
  };

  const getDangerLevelText = (level: number) => {
    if (level >= 70) return "Critical";
    if (level >= 40) return "Warning";
    return "Normal";
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

  if (!devices || devices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No devices registered yet
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Device ID</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Static Danger</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Fire Detection</TableHead>
          <TableHead>Dynamic Danger</TableHead>
          <TableHead>Last Seen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {devices.map((device) => (
          <TableRow key={device._id}>
            <TableCell className="font-mono text-sm">{device.deviceId}</TableCell>
            <TableCell>
              Floor {device.floorNo}, Room {device.roomNo}
            </TableCell>
            <TableCell>
              <Badge variant={getDangerLevelColor(device.staticDangerLevel)}>
                {device.staticDangerLevel}%
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={device.status === "active" ? "default" : "secondary"}>
                {device.status.toUpperCase()}
              </Badge>
            </TableCell>
            <TableCell>
              {device.latestData ? (
                <Badge variant={device.latestData.fireDetection ? "destructive" : "secondary"}>
                  {device.latestData.fireDetection ? `YES (${device.latestData.confidence}%)` : "NO"}
                </Badge>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>
              {device.latestData ? (
                <Badge variant={getDangerLevelColor(device.latestData.dynamicDangerLevel)}>
                  {getDangerLevelText(device.latestData.dynamicDangerLevel)} ({device.latestData.dynamicDangerLevel}%)
                </Badge>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell className="text-xs">
              {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "Never"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
