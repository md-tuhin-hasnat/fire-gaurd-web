"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NavigationIcon } from "lucide-react";

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full" /> }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);

interface RouteMapProps {
  alertId: string;
  fireLocation: [number, number];
  stationLocation: [number, number];
  fireAddress?: string;
  stationName?: string;
}

export default function RouteMap({
  alertId,
  fireLocation,
  stationLocation,
  fireAddress,
  stationName,
}: RouteMapProps) {
  const [route, setRoute] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    fetchRoute();
  }, [fireLocation, stationLocation]);

  const fetchRoute = async () => {
    setLoading(true);
    try {
      // Using OSRM demo server (replace with your own in production)
      const url = `https://router.project-osrm.org/route/v1/driving/${stationLocation[1]},${stationLocation[0]};${fireLocation[1]},${fireLocation[0]}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === "Ok" && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates.map(
          (coord: number[]) => [coord[1], coord[0]] as [number, number]
        );
        setRoute(coordinates);
        setDistance(data.routes[0].distance / 1000); // Convert to km
        setDuration(data.routes[0].duration / 60); // Convert to minutes
      }
    } catch (error) {
      console.error("Failed to fetch route:", error);
    } finally {
      setLoading(false);
    }
  };

  const centerPoint: [number, number] = [
    (fireLocation[0] + stationLocation[0]) / 2,
    (fireLocation[1] + stationLocation[1]) / 2,
  ];

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/${stationLocation[0]},${stationLocation[1]}/${fireLocation[0]},${fireLocation[1]}`;
    window.open(url, "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Guidance</CardTitle>
        <CardDescription>
          Optimal route from {stationName || "Fire Station"} to fire location
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Route Stats */}
        {route.length > 0 && !loading && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-orange-50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Distance</p>
              <p className="text-lg font-bold">{distance.toFixed(1)} km</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Est. Time</p>
              <p className="text-lg font-bold">{Math.ceil(duration)} min</p>
            </div>
            <div>
              <Button onClick={openInGoogleMaps} size="sm" className="w-full">
                <NavigationIcon className="h-4 w-4 mr-2" />
                Navigate
              </Button>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="h-96 w-full rounded-lg overflow-hidden border">
          <MapContainer
            center={centerPoint}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Fire Station Marker */}
            <Marker position={stationLocation}>
              <Popup>
                <strong>{stationName || "Fire Station"}</strong>
                <br />
                Starting Point
              </Popup>
            </Marker>

            {/* Fire Location Marker */}
            <Marker position={fireLocation}>
              <Popup>
                <strong>Fire Location</strong>
                <br />
                {fireAddress || `${fireLocation[0]}, ${fireLocation[1]}`}
              </Popup>
            </Marker>

            {/* Route Line */}
            {route.length > 0 && (
              <Polyline positions={route} color="red" weight={4} opacity={0.7} />
            )}
          </MapContainer>
        </div>

        {loading && (
          <p className="text-sm text-muted-foreground text-center">
            Calculating optimal route...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
