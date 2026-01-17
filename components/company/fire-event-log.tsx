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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FireEvent {
  _id: string;
  device?: {
    deviceId: string;
    roomNo: string;
    floorNo: string;
  };
  fireStation?: {
    name: string;
    contactPhone: string;
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
  resolvedAt?: string;
}

export default function FireEventLog() {
  const [events, setEvents] = useState<FireEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEvents(page);
  }, [page]);

  const fetchEvents = async (pageNum: number) => {
    setLoading(true);
    try {
      console.log('Fetching fire events, page:', pageNum);
      const response = await fetch(`/api/alerts/history?page=${pageNum}&limit=10`);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fire events data:', data);
        setEvents(data.alerts || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        const errorData = await response.text();
        console.error('Failed to fetch fire events:', response.status, errorData);
        setEvents([]);
      }
    } catch (error) {
      console.error("Failed to fetch fire events:", error);
      setEvents([]);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDuration = (createdAt: string, resolvedAt?: string) => {
    if (!resolvedAt) return "Ongoing";
    const start = new Date(createdAt).getTime();
    const end = new Date(resolvedAt).getTime();
    const minutes = Math.floor((end - start) / 60000);
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No fire events recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Device</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Danger Level</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Fire Station</TableHead>
            <TableHead>Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event._id}>
              <TableCell className="text-xs">
                {formatDate(event.createdAt)}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {event.device?.deviceId || "N/A"}
              </TableCell>
              <TableCell className="text-xs">
                {event.device
                  ? `Floor ${event.device.floorNo}, Room ${event.device.roomNo}`
                  : "N/A"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    event.dangerLevel >= 70
                      ? "destructive"
                      : event.dangerLevel >= 40
                      ? "outline"
                      : "secondary"
                  }
                >
                  {event.dangerLevel}%
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusColor(event.status)}>
                  {event.status.replace("_", " ").toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-xs">
                {event.fireStation?.name || "Not assigned"}
              </TableCell>
              <TableCell className="text-xs">
                {getDuration(event.createdAt, event.resolvedAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
