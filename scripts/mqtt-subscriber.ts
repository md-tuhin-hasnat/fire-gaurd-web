/**
 * MQTT Subscriber Start Script
 * Starts the MQTT subscriber process to listen for device data
 */

import { startMQTTSubscriber } from '../lib/mqtt-subscriber';

console.log('🚀 Starting MQTT Subscriber...\n');

// Start the subscriber
const client = startMQTTSubscriber();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down MQTT subscriber...');
  client.end(false, () => {
    console.log('✅ MQTT subscriber stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Shutting down MQTT subscriber...');
  client.end(false, () => {
    console.log('✅ MQTT subscriber stopped');
    process.exit(0);
  });
});

console.log('💡 Press Ctrl+C to stop the subscriber\n');
