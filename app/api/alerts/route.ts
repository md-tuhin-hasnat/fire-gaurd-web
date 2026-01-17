import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Alert from '@/models/Alert';
import Device from '@/models/Device';
import Company from '@/models/Company';
import FireStation from '@/models/FireStation';
import SensorData from '@/models/SensorData';

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

    let alerts;

    if (session.user.role === 'company_admin') {
      // Get alerts for this company's devices
      alerts = await Alert.find({
        companyId: session.user.companyId,
        status: { $ne: 'resolved' },
      })
        .sort({ createdAt: -1 })
        .populate('fireStationId', 'name stationCode')
        .limit(50);
    } else if (session.user.role === 'fire_service') {
      // Get alerts where this fire station is currently assigned OR in escalation history
      console.log('Fire service fetching alerts for:', session.user.fireStationId);
      alerts = await Alert.find({
        $or: [
          { fireStationId: session.user.fireStationId },
          { 'escalationHistory.fireStationId': session.user.fireStationId }
        ],
        status: { $in: ['pending', 'acknowledged', 'en_route', 'arrived'] },
      })
        .sort({ createdAt: -1 })
        .populate('companyId', 'name contactPhone address city location')
        .populate('fireStationId', 'name stationCode')
        .limit(50);
      console.log('Found alerts:', alerts.length);
    } else if (session.user.role === 'super_admin') {
      // Get all alerts
      alerts = await Alert.find()
        .sort({ createdAt: -1 })
        .populate('companyId', 'name city')
        .populate('fireStationId', 'name stationCode')
        .limit(100);
    } else {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 403 }
      );
    }

    // Enrich alerts with device information and sensor data
    const enrichedAlerts = await Promise.all(
      alerts.map(async (alert) => {
        const device = await Device.findOne({ deviceId: alert.deviceId }).lean();
        const company = await Company.findById(alert.companyId).lean();
        const latestSensor = await SensorData.findOne({ deviceId: alert.deviceId })
          .sort({ timestamp: -1 })
          .limit(1)
          .lean();
        
        return {
          _id: alert._id,
          deviceId: alert.deviceId,
          device: device
            ? {
                deviceId: device.deviceId,
                name: `${device.roomNo} - Floor ${device.floorNo}`,
                location: company?.location || {
                  coordinates: [0, 0],
                  address: 'Unknown'
                },
              }
            : null,
          company: company
            ? {
                name: company.name,
                phone: company.contactPhone,
              }
            : null,
          fireStation: alert.fireStationId,
          status: alert.status,
          dangerLevel: alert.dangerLevel,
          initialDangerLevel: alert.initialDangerLevel,
          confidence: alert.confidence,
          humanCount: alert.humanCount,
          sensorData: {
            temperature: 0, // Not available in current schema
            smoke: 0, // Not available in current schema
            gas: 0, // Not available in current schema
            flame: latestSensor?.fireDetection === 1 || false,
          },
          responseTimeout: alert.responseTimeout,
          escalationHistory: alert.escalationHistory,
          createdAt: alert.createdAt,
          resolvedAt: alert.resolvedAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      alerts: enrichedAlerts,
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
