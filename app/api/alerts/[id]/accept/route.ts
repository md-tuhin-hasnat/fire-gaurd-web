import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { acceptAlert } from '@/lib/alert-manager';

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

    const { id: alertId } = await params;
    const fireStationId = session.user.fireStationId;

    if (!fireStationId) {
      return NextResponse.json(
        { error: 'Fire station ID not found' },
        { status: 400 }
      );
    }

    const alert = await acceptAlert(alertId, fireStationId);

    return NextResponse.json({
      success: true,
      message: 'Alert accepted successfully',
      data: {
        alertId: alert._id,
        status: alert.status,
      },
    });
  } catch (error: any) {
    console.error('Accept alert error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
