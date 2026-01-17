import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import Device from '@/models/Device';
import Company from '@/models/Company';
import { verifyPassword } from '@/lib/auth';
import { z } from 'zod';

const RegisterDeviceSchema = z.object({
  deviceId: z.string().min(5).max(50),
  activationKey: z.string().min(8).max(50),
  roomNo: z.string().min(1),
  floorNo: z.string().min(1),
  staticDangerLevel: z.number().min(0).max(100),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'company_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = RegisterDeviceSchema.parse(body);

    await connectDB();

    // Find device by ID
    const device = await Device.findOne({ 
      deviceId: validated.deviceId.toUpperCase() 
    });

    if (!device) {
      return NextResponse.json(
        { error: 'Invalid device ID' },
        { status: 404 }
      );
    }

    if (device.isRegistered) {
      return NextResponse.json(
        { error: 'Device already registered' },
        { status: 400 }
      );
    }

    // Verify activation key
    const isValidKey = await verifyPassword(
      validated.activationKey.toUpperCase(),
      device.activationKeyHash
    );

    if (!isValidKey) {
      return NextResponse.json(
        { error: 'Invalid activation key' },
        { status: 400 }
      );
    }

    // Register device
    device.companyId = session.user.companyId as any;
    device.roomNo = validated.roomNo;
    device.floorNo = validated.floorNo;
    device.staticDangerLevel = validated.staticDangerLevel;
    device.isRegistered = true;
    device.registeredAt = new Date();
    device.status = 'active';
    await device.save();

    // Add device to company's device list
    await Company.findByIdAndUpdate(
      session.user.companyId,
      { $push: { devices: device._id } }
    );

    return NextResponse.json({
      success: true,
      message: 'Device registered successfully',
      data: {
        deviceId: device.deviceId,
        roomNo: device.roomNo,
        floorNo: device.floorNo,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Device registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
