import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { updateAlertStatus } from '@/lib/alert-manager';
import { z } from 'zod';

const UpdateStatusSchema = z.object({
  status: z.enum(['en_route', 'arrived', 'resolved', 'false_alarm']),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'fire_service') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = UpdateStatusSchema.parse(body);
    const { id: alertId } = await params;

    const alert = await updateAlertStatus(
      alertId,
      validated.status,
      validated.notes
    );

    return NextResponse.json({
      success: true,
      message: 'Alert status updated successfully',
      data: {
        alertId: alert._id,
        status: alert.status,
        resolvedAt: alert.resolvedAt,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update alert status error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
