import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import Company from "@/models/Company";
import Device from "@/models/Device";
import Alert from "@/models/Alert";
import FireStation from "@/models/FireStation";
import TrafficPolice from "@/models/TrafficPolice";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get stats in parallel
    const [
      totalCompanies,
      totalDevices,
      activeDevices,
      totalAlerts,
      pendingAlerts,
      fireStations,
      trafficPolice,
    ] = await Promise.all([
      Company.countDocuments(),
      Device.countDocuments(),
      Device.countDocuments({ isActive: true }),
      Alert.countDocuments(),
      Alert.countDocuments({ status: "pending" }),
      FireStation.countDocuments(),
      TrafficPolice.countDocuments(),
    ]);

    return NextResponse.json({
      totalCompanies,
      totalDevices,
      activeDevices,
      totalAlerts,
      pendingAlerts,
      fireStations,
      trafficPolice,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
