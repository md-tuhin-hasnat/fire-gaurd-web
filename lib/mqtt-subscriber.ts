/**
 * MQTT Subscriber
 * Subscribes to device data topics and saves to database
 * Implements 5-minute interval logic and immediate fire detection saves
 */

import mqtt, { MqttClient } from 'mqtt';
import { z } from 'zod';
import connectDB from './db';
import Device from '@/models/Device';
import SensorData from '@/models/SensorData';
import DeviceWarning from '@/models/DeviceWarning';
import { createAlert } from './alert-manager';

// Validation schema for incoming sensor data
const SensorDataSchema = z.object({
  id: z.string(),
  fireDetection: z.union([z.literal(0), z.literal(1)]),
  confidence: z.number().min(0).max(100),
  human: z.number().min(0),
  timestamp: z.string().or(z.number()),
});

// Track last save time for each device (5-minute interval logic)
const lastSaveTime: Map<string, number> = new Map();

// Device offline threshold (2 minutes)
const DEVICE_OFFLINE_THRESHOLD = parseInt(
  process.env.DEVICE_OFFLINE_THRESHOLD || '120000'
);

// Data save interval (5 minutes)
const DATA_SAVE_INTERVAL = parseInt(
  process.env.DATA_SAVE_INTERVAL || '300000'
);

/**
 * Calculate dynamic danger level
 * Formula: staticLevel + (confidence * 0.6) + (humanCount * 0.4)
 */
function calculateDynamicDangerLevel(
  staticLevel: number,
  fireConfidence: number,
  humanCount: number
): number {
  const dynamic = staticLevel + fireConfidence * 0.6 + Math.min(humanCount * 0.4, 30);
  return Math.min(Math.max(dynamic, 0), 100); // Clamp between 0-100
}

/**
 * Process incoming sensor data
 */
async function processSensorData(deviceId: string, rawData: string) {
  try {
    // Parse and validate data
    const parsed = JSON.parse(rawData);
    const validated = SensorDataSchema.parse(parsed);

    await connectDB();

    // Get device from database
    const device = await Device.findOne({ deviceId: validated.id });

    if (!device) {
      console.warn(`⚠️  Device not found: ${validated.id}`);
      return;
    }

    if (!device.isRegistered) {
      console.warn(`⚠️  Device not registered: ${validated.id}`);
      return;
    }

    // Update device last seen time
    device.lastSeenAt = new Date();
    
    // Check if device was offline and now back online
    if (device.status === 'offline') {
      device.status = 'active';
      
      // Resolve offline warnings
      await DeviceWarning.updateMany(
        { deviceId: device.deviceId, warningType: 'offline', isResolved: false },
        { isResolved: true, resolvedAt: new Date() }
      );
      
      console.log(`✅ Device ${device.deviceId} is back online`);
    }

    await device.save();

    // Calculate dynamic danger level
    const dynamicDangerLevel = calculateDynamicDangerLevel(
      device.staticDangerLevel,
      validated.confidence,
      validated.human
    );

    const currentTime = Date.now();
    const lastSave = lastSaveTime.get(deviceId) || 0;
    const timeSinceLastSave = currentTime - lastSave;

    // Determine if we should save data
    const shouldSave =
      validated.fireDetection === 1 || // Always save when fire detected
      timeSinceLastSave >= DATA_SAVE_INTERVAL; // Or every 5 minutes

    if (shouldSave) {
      // Save sensor data
      await SensorData.create({
        deviceId: device.deviceId,
        companyId: device.companyId,
        fireDetection: validated.fireDetection,
        confidence: validated.confidence,
        humanCount: validated.human,
        timestamp: new Date(validated.timestamp),
        dynamicDangerLevel,
      });

      lastSaveTime.set(deviceId, currentTime);

      console.log(
        `💾 Saved data for ${deviceId} - Fire: ${validated.fireDetection}, Confidence: ${validated.confidence}%, Humans: ${validated.human}, Danger: ${Math.round(dynamicDangerLevel)}`
      );

      // Create alert if fire detected
      if (validated.fireDetection === 1) {
        console.log(`🔥 FIRE DETECTED at ${deviceId}!`);
        
        await createAlert({
          deviceId: device.deviceId,
          companyId: device.companyId.toString(),
          dangerLevel: dynamicDangerLevel,
          confidence: validated.confidence,
          humanCount: validated.human,
        });
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`❌ Invalid sensor data format:`, error.issues);
    } else {
      console.error(`❌ Error processing sensor data:`, error);
    }
  }
}

/**
 * Check for offline devices periodically
 */
async function checkOfflineDevices() {
  try {
    await connectDB();

    const devices = await Device.find({ isRegistered: true, status: 'active' });

    for (const device of devices) {
      if (!device.lastSeenAt) continue;

      const timeSinceLastSeen = Date.now() - device.lastSeenAt.getTime();

      if (timeSinceLastSeen > DEVICE_OFFLINE_THRESHOLD) {
        device.status = 'offline';
        await device.save();

        // Create offline warning
        const existingWarning = await DeviceWarning.findOne({
          deviceId: device.deviceId,
          warningType: 'offline',
          isResolved: false,
        });

        if (!existingWarning) {
          await DeviceWarning.create({
            deviceId: device.deviceId,
            companyId: device.companyId,
            warningType: 'offline',
            message: `Device ${device.deviceId} has been offline for more than 2 minutes`,
            isResolved: false,
          });

          console.log(`⚠️  Device ${device.deviceId} marked as OFFLINE`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking offline devices:', error);
  }
}

/**
 * Start MQTT subscriber
 */
export function startMQTTSubscriber(): MqttClient {
  const brokerUrl = `mqtt://localhost:${process.env.MQTT_BROKER_PORT || 1883}`;
  
  const client = mqtt.connect(brokerUrl, {
    clientId: `subscriber_${Math.random().toString(16).slice(2, 8)}`,
  });

  client.on('connect', () => {
    console.log('✅ MQTT Subscriber connected to broker');
    
    // Subscribe to all device data topics
    client.subscribe('devices/+/data', (err) => {
      if (err) {
        console.error('❌ Subscription error:', err);
      } else {
        console.log('📡 Subscribed to: devices/+/data');
      }
    });
  });

  client.on('message', (topic, message) => {
    // Extract device ID from topic: devices/{deviceId}/data
    const deviceId = topic.split('/')[1];
    processSensorData(deviceId, message.toString());
  });

  client.on('error', (error) => {
    console.error('❌ MQTT Subscriber error:', error);
  });

  // Check for offline devices every minute
  setInterval(checkOfflineDevices, 60000);

  return client;
}

export default startMQTTSubscriber;
