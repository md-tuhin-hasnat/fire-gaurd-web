import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Device from '@/models/Device';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    await connectDB();

    let query: any = { isRegistered: true };

    // Filter by company for company admins
    if (session?.user.role === 'company_admin') {
      query.companyId = session.user.companyId;
    }
    // Super admin can see all devices

    const devices = await Device.find(query)
      .select('deviceId roomNo floorNo staticDangerLevel status')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      devices: devices.map(d => ({
        _id: d._id,
        deviceId: d.deviceId,
        roomNo: d.roomNo,
        floorNo: d.floorNo,
        staticDangerLevel: d.staticDangerLevel,
        status: d.status,
      })),
    });
  } catch (error) {
    console.error('Error fetching devices for simulator:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
