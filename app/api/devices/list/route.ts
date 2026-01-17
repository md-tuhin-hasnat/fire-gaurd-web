import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Device from '@/models/Device';
import SensorData from '@/models/SensorData';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'company_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get all devices for this company
    const devices = await Device.find({
      companyId: session.user.companyId,
      isRegistered: true,
    }).sort({ createdAt: -1 });

    // Get latest sensor data for each device
    const devicesWithData = await Promise.all(
      devices.map(async (device) => {
        const latestData = await SensorData.findOne({
          deviceId: device.deviceId,
        }).sort({ timestamp: -1 });

        // Check if device is offline
        const isOffline = device.lastSeenAt
          ? Date.now() - device.lastSeenAt.getTime() > 120000
          : true;

        return {
          _id: device._id,
          deviceId: device.deviceId,
          roomNo: device.roomNo,
          floorNo: device.floorNo,
          staticDangerLevel: device.staticDangerLevel,
          status: isOffline ? 'offline' : device.status,
          lastSeenAt: device.lastSeenAt,
          latestData: latestData
            ? {
                fireDetection: latestData.fireDetection,
                confidence: latestData.confidence,
                humanCount: latestData.humanCount,
                dynamicDangerLevel: latestData.dynamicDangerLevel,
                timestamp: latestData.timestamp,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      devices: devicesWithData,
    });
  } catch (error) {
    console.error('Get devices error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
