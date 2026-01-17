import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Alert from '@/models/Alert';
import Device from '@/models/Device';
import FireStation from '@/models/FireStation';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let query: any = {};

    // Filter by company for company admins
    if (session.user.role === 'company_admin') {
      const devices = await Device.find({
        companyId: session.user.companyId,
      }).select('deviceId');
      const deviceIds = devices.map(d => d.deviceId);
      query.deviceId = { $in: deviceIds };
      
      console.log(`[History API] Company admin: ${session.user.email}, devices: ${deviceIds.length}`);
    }

    // Get total count
    const total = await Alert.countDocuments(query);
    console.log(`[History API] Total alerts matching query: ${total}`);

    // Get alerts
    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log(`[History API] Fetched ${alerts.length} alerts for page ${page}`);

    // Get device info separately
    const deviceIds = [...new Set(alerts.map(a => a.deviceId))];
    const devices = await Device.find({ deviceId: { $in: deviceIds } })
      .select('deviceId roomNo floorNo');
    
    const deviceMap = new Map(devices.map(d => [d.deviceId, d]));

    // Get fire station info separately
    const fireStationIds = alerts
      .map((a: any) => a.fireStationId)
      .filter(id => id);
    const fireStations = await FireStation.find({ _id: { $in: fireStationIds } })
      .select('name contactPhone');
    const fireStationMap = new Map(fireStations.map(fs => [fs._id.toString(), fs]));

    const alertsData = alerts.map((alert: any) => {
      const alertObj = alert.toObject();
      const device = deviceMap.get(alertObj.deviceId);
      const fireStation = alertObj.fireStationId 
        ? fireStationMap.get(alertObj.fireStationId.toString())
        : null;
      
      return {
        _id: alertObj._id,
        device: device ? {
          deviceId: device.deviceId,
          roomNo: device.roomNo,
          floorNo: device.floorNo,
        } : null,
        fireStation: fireStation ? {
          name: fireStation.name,
          contactPhone: fireStation.contactPhone,
        } : null,
        dangerLevel: alertObj.dangerLevel,
        sensorData: {
          temperature: 0, // Not stored in alert
          smoke: 0,
          gas: 0,
          flame: alertObj.confidence > 70,
        },
        status: alertObj.status,
        createdAt: alertObj.createdAt,
        resolvedAt: alertObj.resolvedAt,
      };
    });

    return NextResponse.json({
      success: true,
      alerts: alertsData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching alert history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
