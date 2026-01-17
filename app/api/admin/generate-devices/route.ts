import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import Device from "@/models/Device";
import { hashPassword } from "@/lib/auth";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { count = 1 } = body;

    if (count < 1 || count > 100) {
      return NextResponse.json(
        { error: "Count must be between 1 and 100" },
        { status: 400 }
      );
    }

    await connectDB();

    // Generate and save devices
    const devices = [];
    for (let i = 0; i < count; i++) {
      const deviceId = `FG-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      const activationKey = crypto.randomBytes(16).toString("hex").toUpperCase();
      const activationKeyHash = await hashPassword(activationKey);
      
      // Create device in database
      const device = await Device.create({
        deviceId,
        activationKeyHash,
        isRegistered: false,
        status: "inactive",
      });

      devices.push({
        deviceId,
        activationKey,
      });

      // Small delay to ensure unique timestamps
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    return NextResponse.json({ devices });
  } catch (error) {
    console.error("Error generating devices:", error);
    return NextResponse.json(
      { error: "Failed to generate devices" },
      { status: 500 }
    );
  }
}
