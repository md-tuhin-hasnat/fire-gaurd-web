"use client";

import { useEffect, useState } from "react";
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
import { Flame, Users, AlertTriangle } from "lucide-react";

interface LiveStatus {
  deviceId: string;
  roomNo: string;
  floorNo: string;
  fireDetection: boolean;
  confidence: number;
  humanCount: number;
  dynamicDangerLevel: number;
  timestamp: string;
}

export default function LiveFireStatus() {
  const [statuses, setStatuses] = useState<LiveStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalDevices: 0,
    devicesWithFire: 0,
    totalPeople: 0,
    highRiskLocations: 0,
  });

  useEffect(() => {
    fetchLiveStatus();
    // Refresh every 10 seconds
    const interval = setInterval(fetchLiveStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveStatus = async () => {
    try {
      const response = await fetch('/api/devices/live-status');
      if (response.ok) {
        const data = await response.json();
        setStatuses(data.devices || []);
        
        // Calculate summary
        const devicesWithFire = data.devices.filter((d: LiveStatus) => d.fireDetection).length;
        const totalPeople = data.devices.reduce((sum: number, d: LiveStatus) => sum + d.humanCount, 0);
        const highRisk = data.devices.filter((d: LiveStatus) => d.dynamicDangerLevel >= 70).length;
        
        setSummary({
          totalDevices: data.devices.length,
          devicesWithFire,
          totalPeople,
          highRiskLocations: highRisk,
        });
      } else {
        setStatuses([]);
      }
    } catch (error) {
      console.error("Failed to fetch live status:", error);
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Devices</p>
              <p className="text-2xl font-bold">{summary.totalDevices}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xl">📱</span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Fire Detected</p>
              <p className="text-2xl font-bold text-red-600">{summary.devicesWithFire}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <Flame className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total People</p>
              <p className="text-2xl font-bold text-blue-600">{summary.totalPeople}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">High Risk</p>
              <p className="text-2xl font-bold text-orange-600">{summary.highRiskLocations}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Live Status Table */}
      {statuses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No live data available
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>Device ID</TableHead>
              <TableHead>Fire Status</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>People Count</TableHead>
              <TableHead>Danger Level</TableHead>
              <TableHead>Last Update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statuses.map((status) => (
              <TableRow key={status.deviceId} className={status.fireDetection ? 'bg-red-50' : ''}>
                <TableCell className="font-medium">
                  Floor {status.floorNo}, Room {status.roomNo}
                </TableCell>
                <TableCell className="font-mono text-xs">{status.deviceId}</TableCell>
                <TableCell>
                  {status.fireDetection ? (
                    <Badge variant="destructive" className="gap-1">
                      <Flame className="h-3 w-3" />
                      FIRE DETECTED
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Normal</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {status.fireDetection && (
                    <span className="font-semibold">{status.confidence}%</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">{status.humanCount}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      status.dynamicDangerLevel >= 70
                        ? "destructive"
                        : status.dynamicDangerLevel >= 40
                        ? "outline"
                        : "secondary"
                    }
                  >
                    {status.dynamicDangerLevel}%
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {getTimeAgo(status.timestamp)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Auto-refresh indicator */}
      <div className="text-xs text-muted-foreground text-center">
        🔄 Auto-refreshing every 10 seconds
      </div>
    </div>
  );
}
