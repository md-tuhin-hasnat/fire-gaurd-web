/**
 * Alert Manager
 * Handles fire alert creation, escalation, and fire station notification
 */

import connectDB from './db';
import Alert, { IAlert, IEscalationEntry } from '@/models/Alert';
import FireStation from '@/models/FireStation';
import Device from '@/models/Device';
import Company from '@/models/Company';
import { sendSMS } from './sms-service';
import mongoose from 'mongoose';

// Timeout configurations based on danger level
const ALERT_TIMEOUTS = {
  high: parseInt(process.env.ALERT_TIMEOUT_HIGH_DANGER || '180000'), // 3 minutes
  mid: parseInt(process.env.ALERT_TIMEOUT_MID_DANGER || '300000'), // 5 minutes
  normal: parseInt(process.env.ALERT_TIMEOUT_NORMAL_DANGER || '600000'), // 10 minutes
};

// Track active escalation timers
const escalationTimers: Map<string, NodeJS.Timeout> = new Map();

/**
 * Get response timeout based on danger level
 */
function getResponseTimeout(dangerLevel: number): number {
  if (dangerLevel >= 61) return ALERT_TIMEOUTS.high;
  if (dangerLevel >= 31) return ALERT_TIMEOUTS.mid;
  return ALERT_TIMEOUTS.normal;
}

/**
 * Find nearest fire stations to a location
 */
async function findNearestFireStations(
  coordinates: [number, number],
  limit: number = 10
) {
  return await FireStation.find({
    isActive: true,
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates,
        },
      },
    },
  }).limit(limit);
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const dLon = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1[1] * Math.PI) / 180) *
      Math.cos((coord2[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Handle alert escalation (timeout or pass)
 */
async function escalateAlert(alertId: string) {
  try {
    await connectDB();

    const alert = await Alert.findById(alertId);
    if (!alert) {
      console.error(`Alert ${alertId} not found for escalation`);
      return;
    }

    // Don't escalate if alert is already acknowledged or resolved
    if (alert.status !== 'pending') {
      console.log(`Alert ${alertId} already ${alert.status}, skipping escalation`);
      return;
    }

    // Increment danger level by 20 points
    alert.dangerLevel = Math.min(alert.dangerLevel + 20, 100);

    // Get company location for finding next station
    const device = await Device.findOne({ deviceId: alert.deviceId });
    if (!device) {
      console.error(`Device ${alert.deviceId} not found`);
      return;
    }

    const company = await Company.findById(device.companyId);
    if (!company) {
      console.error(`Company ${device.companyId} not found`);
      return;
    }

    // Find next nearest fire station (excluding already notified ones)
    const notifiedStationIds = alert.escalationHistory.map(
      (entry) => entry.fireStationId.toString()
    );

    const allNearestStations = await findNearestFireStations(
      company.location.coordinates
    );

    const nextStation = allNearestStations.find(
      (station) => !notifiedStationIds.includes(station._id.toString())
    );

    if (nextStation) {
      // Assign to next fire station
      alert.fireStationId = nextStation._id;

      // Add to escalation history
      alert.escalationHistory.push({
        fireStationId: nextStation._id,
        notifiedAt: new Date(),
        dangerLevelAtTime: alert.dangerLevel,
      });

      // Update timeout based on new danger level
      alert.responseTimeout = getResponseTimeout(alert.dangerLevel);

      await alert.save();

      console.log(
        `🔄 Alert ${alertId} escalated to ${nextStation.name} (Danger level: ${Math.round(alert.dangerLevel)})`
      );

      // Start new escalation timer
      startEscalationTimer(alert);

      // TODO: Send notification to fire station (implement notification system)
    } else {
      console.warn(`⚠️  No more fire stations available for alert ${alertId}`);
      
      // TODO: Notify central emergency coordination center as fallback
    }
  } catch (error) {
    console.error(`Error escalating alert ${alertId}:`, error);
  }
}

/**
 * Start escalation timer for an alert
 */
function startEscalationTimer(alert: IAlert) {
  const alertId = alert._id.toString();

  // Clear existing timer if any
  const existingTimer = escalationTimers.get(alertId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Set new timer
  const timer = setTimeout(() => {
    console.log(`⏰ Alert ${alertId} timeout - escalating...`);
    escalateAlert(alertId);
  }, alert.responseTimeout);

  escalationTimers.set(alertId, timer);
}

/**
 * Stop escalation timer for an alert
 */
export function stopEscalationTimer(alertId: string) {
  const timer = escalationTimers.get(alertId);
  if (timer) {
    clearTimeout(timer);
    escalationTimers.delete(alertId);
    console.log(`✅ Escalation timer stopped for alert ${alertId}`);
  }
}

/**
 * Create a new fire alert
 */
export async function createAlert(params: {
  deviceId: string;
  companyId: string;
  dangerLevel: number;
  confidence: number;
  humanCount: number;
}): Promise<IAlert | null> {
  try {
    await connectDB();

    // Check if there's already an active alert for this device
    const existingAlert = await Alert.findOne({
      deviceId: params.deviceId,
      status: { $in: ['pending', 'acknowledged', 'en_route', 'arrived'] },
    });

    if (existingAlert) {
      console.log(`Alert already exists for device ${params.deviceId}`);
      return existingAlert;
    }

    // Get company location
    const company = await Company.findById(params.companyId);
    if (!company) {
      console.error(`Company ${params.companyId} not found`);
      return null;
    }

    // Find nearest fire station
    const nearestStations = await findNearestFireStations(
      company.location.coordinates,
      1
    );

    if (nearestStations.length === 0) {
      console.error('No fire stations found');
      return null;
    }

    const nearestStation = nearestStations[0];

    // Determine timeout based on danger level
    const responseTimeout = getResponseTimeout(params.dangerLevel);

    // Create alert
    const alert = await Alert.create({
      deviceId: params.deviceId,
      companyId: params.companyId,
      fireStationId: nearestStation._id,
      status: 'pending',
      dangerLevel: params.dangerLevel,
      initialDangerLevel: params.dangerLevel,
      confidence: params.confidence,
      humanCount: params.humanCount,
      responseTimeout,
      escalationHistory: [
        {
          fireStationId: nearestStation._id,
          notifiedAt: new Date(),
          dangerLevelAtTime: params.dangerLevel,
        },
      ],
    });

    const distance = calculateDistance(
      company.location.coordinates,
      nearestStation.location.coordinates
    );

    console.log(
      `🚨 FIRE ALERT CREATED!\n` +
        `   Device: ${params.deviceId}\n` +
        `   Company: ${company.name}\n` +
        `   Danger Level: ${Math.round(params.dangerLevel)}\n` +
        `   Assigned to: ${nearestStation.name} (${distance.toFixed(2)} km away)\n` +
        `   Timeout: ${responseTimeout / 1000 / 60} minutes`
    );

    // Start escalation timer
    startEscalationTimer(alert);

    // TODO: Send real-time notification to fire station via SSE/WebSocket
    // TODO: Send notification to company admin

    return alert;
  } catch (error) {
    console.error('Error creating alert:', error);
    return null;
  }
}

/**
 * Fire station accepts an alert
 */
export async function acceptAlert(alertId: string, fireStationId: string) {
  try {
    await connectDB();

    const alert = await Alert.findById(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    // Check if this fire station is in the escalation history (current or previous)
    const isInHistory = alert.escalationHistory.some(
      (entry) => entry.fireStationId.toString() === fireStationId
    );

    if (!isInHistory) {
      throw new Error('This alert was not assigned to your fire station');
    }

    if (alert.status !== 'pending') {
      throw new Error(`Alert is already ${alert.status}`);
    }

    // Update alert status and assign to accepting station
    alert.status = 'acknowledged';
    alert.fireStationId = new mongoose.Types.ObjectId(fireStationId);

    // Update escalation history
    const currentEscalation = alert.escalationHistory.find(
      (entry) => entry.fireStationId.toString() === fireStationId && !entry.response
    );

    if (currentEscalation) {
      currentEscalation.response = 'accepted';
      currentEscalation.respondedAt = new Date();
    }

    await alert.save();

    // Stop escalation timer
    stopEscalationTimer(alertId);

    console.log(`✅ Alert ${alertId} accepted by fire station ${fireStationId}`);

    return alert;
  } catch (error) {
    console.error('Error accepting alert:', error);
    throw error;
  }
}

/**
 * Fire station passes an alert to next station
 */
export async function passAlert(alertId: string, fireStationId: string) {
  try {
    await connectDB();

    const alert = await Alert.findById(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    if (alert.fireStationId?.toString() !== fireStationId) {
      throw new Error('This alert is not assigned to your fire station');
    }

    if (alert.status !== 'pending') {
      throw new Error(`Alert is already ${alert.status}`);
    }

    // Update escalation history
    const currentEscalation = alert.escalationHistory.find(
      (entry) => entry.fireStationId.toString() === fireStationId && !entry.response
    );

    if (currentEscalation) {
      currentEscalation.response = 'passed';
      currentEscalation.respondedAt = new Date();
    }

    await alert.save();

    // Stop current timer and immediately escalate
    stopEscalationTimer(alertId);
    await escalateAlert(alertId);

    console.log(`⏭️  Alert ${alertId} passed by fire station ${fireStationId}`);

    return alert;
  } catch (error) {
    console.error('Error passing alert:', error);
    throw error;
  }
}

/**
 * Update alert status (en_route, arrived, resolved)
 */
export async function updateAlertStatus(
  alertId: string,
  status: 'en_route' | 'arrived' | 'resolved' | 'false_alarm',
  notes?: string
) {
  try {
    await connectDB();

    const alert = await Alert.findById(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = status;

    if (status === 'resolved' || status === 'false_alarm') {
      alert.resolvedAt = new Date();
      if (notes) {
        alert.resolutionNotes = notes;
      }
      // Stop escalation timer
      stopEscalationTimer(alertId);
    }

    await alert.save();

    console.log(`📝 Alert ${alertId} status updated to: ${status}`);

    return alert;
  } catch (error) {
    console.error('Error updating alert status:', error);
    throw error;
  }
}

export default createAlert;
