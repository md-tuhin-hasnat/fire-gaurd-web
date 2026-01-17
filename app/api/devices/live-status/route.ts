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
    });

    // Get latest sensor data for each device
    const liveStatuses = await Promise.all(
      devices.map(async (device) => {
        const latestData = await SensorData.findOne({
          deviceId: device.deviceId,
        }).sort({ timestamp: -1 });

        if (!latestData) {
          return null;
        }

        return {
          deviceId: device.deviceId,
          roomNo: device.roomNo,
          floorNo: device.floorNo,
          fireDetection: latestData.fireDetection,
          confidence: latestData.confidence,
          humanCount: latestData.humanCount,
          dynamicDangerLevel: latestData.dynamicDangerLevel,
          timestamp: latestData.timestamp,
        };
      })
    );

    // Filter out null values (devices with no data)
    const validStatuses = liveStatuses.filter(s => s !== null);

    return NextResponse.json({
      success: true,
      devices: validStatuses,
    });
  } catch (error) {
    console.error('Error fetching live status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
