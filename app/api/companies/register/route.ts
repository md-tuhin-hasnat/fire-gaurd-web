import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Company from '@/models/Company';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

const RegisterCompanySchema = z.object({
  // Company info
  companyName: z.string().min(2).max(100),
  companyType: z.enum([
    'garments',
    'oil_gas',
    'manufacturing',
    'warehouse',
    'hospital',
    'hotel',
    'shopping_mall',
    'office_building',
    'educational',
    'other',
  ]),
  address: z.string().min(5),
  city: z.string().min(2),
  country: z.string().default('Bangladesh'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  contactPhone: z.string().min(10),
  
  // Admin user info
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = RegisterCompanySchema.parse(body);

    await connectDB();

    // Check if email already exists
    const existingUser = await User.findOne({ email: validated.adminEmail.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Create company
    const company = await Company.create({
      name: validated.companyName,
      companyType: validated.companyType,
      location: {
        type: 'Point',
        coordinates: [validated.longitude, validated.latitude],
      },
      contactEmail: validated.adminEmail,
      contactPhone: validated.contactPhone,
      address: validated.address,
      city: validated.city,
      country: validated.country,
      devices: [],
      isActive: true,
    });

    // Create admin user
    const hashedPassword = await hashPassword(validated.adminPassword);
    const adminUser = await User.create({
      email: validated.adminEmail.toLowerCase(),
      password: hashedPassword,
      name: validated.adminName,
      role: 'company_admin',
      companyId: company._id,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Company registered successfully',
      data: {
        companyId: company._id,
        companyName: company.name,
        adminEmail: adminUser.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Company registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
