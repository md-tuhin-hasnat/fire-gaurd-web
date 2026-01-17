import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import SensorData from "@/models/SensorData";
import Alert from "@/models/Alert";
import Device from "@/models/Device";

// Keep track of connected clients
const clients = new Set<ReadableStreamDefaultController>();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connectDB();

  // Create a readable stream
  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);

      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: "connected" })}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));

      // Set up periodic updates
      const interval = setInterval(async () => {
        try {
          // Fetch latest data based on user role
          let updates: any = {};

          if (session.user.role === "company_admin") {
            const [latestSensorData, recentAlerts, devices] = await Promise.all([
              SensorData.find({ companyId: session.user.companyId })
                .sort({ timestamp: -1 })
                .limit(10),
              Alert.find({ companyId: session.user.companyId })
                .sort({ createdAt: -1 })
                .limit(5),
              Device.find({ companyId: session.user.companyId }),
            ]);

            updates = {
              type: "update",
              sensorData: latestSensorData,
              alerts: recentAlerts,
              deviceCount: devices.length,
              activeDevices: devices.filter((d: any) => d.isActive).length,
            };
          } else if (session.user.role === "fire_service") {
            const alerts = await Alert.find({
              $or: [
                { status: "pending" },
                { status: "accepted", acceptedBy: session.user.fireStationId },
                { status: "en_route", acceptedBy: session.user.fireStationId },
                { status: "arrived", acceptedBy: session.user.fireStationId },
              ],
            })
              .populate("device")
              .populate("company")
              .sort({ createdAt: -1 })
              .limit(20);

            updates = {
              type: "update",
              alerts,
            };
          } else if (session.user.role === "super_admin") {
            const [totalAlerts, pendingAlerts, activeDevices] = await Promise.all([
              Alert.countDocuments(),
              Alert.countDocuments({ status: "pending" }),
              Device.countDocuments({ isActive: true }),
            ]);

            updates = {
              type: "update",
              totalAlerts,
              pendingAlerts,
              activeDevices,
            };
          }

          const message = `data: ${JSON.stringify(updates)}\n\n`;
          controller.enqueue(new TextEncoder().encode(message));
        } catch (error) {
          console.error("SSE update error:", error);
        }
      }, 5000); // Update every 5 seconds

      // Clean up on close
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        clients.delete(controller);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// Broadcast function for other parts of the app to trigger updates
export function broadcastUpdate(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoded = new TextEncoder().encode(message);

  clients.forEach((controller) => {
    try {
      controller.enqueue(encoded);
    } catch (error) {
      clients.delete(controller);
    }
  });
}
