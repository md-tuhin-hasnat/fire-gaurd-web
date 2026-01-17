import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import Alert from "@/models/Alert";
import Device from "@/models/Device";
import Company from "@/models/Company";
import FireStation from "@/models/FireStation";
import SensorData from "@/models/SensorData";
import RouteMap from "@/components/fire-service/route-map";
import AlertDetails from "@/components/fire-service/alert-details";

interface AlertDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AlertDetailPage({ params }: AlertDetailPageProps) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "fire_service") {
    redirect("/dashboard");
  }

  await connectDB();

  const alert = await Alert.findById(id).lean();

  if (!alert) {
    redirect("/fire-service/alerts");
  }

  // Manually fetch related data
  const device = await Device.findOne({ deviceId: alert.deviceId }).lean();
  const company = await Company.findById(alert.companyId).lean();
  const fireStation = alert.fireStationId ? await FireStation.findById(alert.fireStationId).lean() : null;
  const latestSensor = await SensorData.findOne({ deviceId: alert.deviceId })
    .sort({ timestamp: -1 })
    .limit(1)
    .lean();

  const alertData: any = {
    _id: alert._id.toString(),
    deviceId: alert.deviceId,
    status: alert.status,
    dangerLevel: alert.dangerLevel,
    initialDangerLevel: alert.initialDangerLevel,
    confidence: alert.confidence,
    humanCount: alert.humanCount,
    createdAt: alert.createdAt?.toISOString(),
    resolvedAt: alert.resolvedAt?.toISOString(),
    responseTimeout: alert.responseTimeout,
    sensorData: {
      temperature: 0, // Not available in current schema
      smoke: 0, // Not available in current schema
      gas: 0, // Not available in current schema
      flame: latestSensor?.fireDetection === 1 || false,
    },
    escalationHistory: alert.escalationHistory?.map((entry: any) => ({
      fireStationId: entry.fireStationId?.toString(),
      notifiedAt: entry.notifiedAt?.toISOString(),
      response: entry.response,
      respondedAt: entry.respondedAt?.toISOString(),
      dangerLevelAtTime: entry.dangerLevelAtTime
    })) || [],
    device: device ? {
      deviceId: device.deviceId,
      roomNo: device.roomNo,
      floorNo: device.floorNo,
      location: company?.location || { coordinates: [0, 0], address: 'Unknown' }
    } : null,
    company: company ? {
      name: company.name,
      contactPhone: company.contactPhone,
      address: company.address,
      city: company.city,
      location: company.location
    } : null,
    acceptedBy: fireStation ? {
      _id: fireStation._id.toString(),
      name: fireStation.name,
      stationCode: fireStation.stationCode,
      location: fireStation.location,
      contactPhone: fireStation.contactPhone,
      address: fireStation.address,
      city: fireStation.city
    } : null
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alert Details</h1>
        <p className="text-muted-foreground">
          Fire incident #{alert._id.toString().slice(-8)}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <AlertDetails alert={alertData} />
        
        {fireStation && alertData.device?.location && (
          <RouteMap
            alertId={alertData._id}
            fireLocation={[alertData.device.location.coordinates[1], alertData.device.location.coordinates[0]]}
            stationLocation={[fireStation.location.coordinates[1], fireStation.location.coordinates[0]]}
            fireAddress={alertData.device.location.address || 'Unknown location'}
            stationName={fireStation.name}
          />
        )}
      </div>
    </div>
  );
}
