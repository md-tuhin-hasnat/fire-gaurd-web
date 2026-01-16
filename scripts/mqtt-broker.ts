#!/usr/bin/env tsx

/**
 * Standalone MQTT Broker Script
 * Run with: npm run mqtt
 */

import { startMQTTBroker } from '../lib/mqtt-broker';

console.log('🔥 Starting Fire Guard MQTT Broker...\n');

const { broker, tcpServer, httpServer } = startMQTTBroker();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down MQTT broker...');
  tcpServer.close(() => {
    httpServer.close(() => {
      console.log('✅ MQTT broker closed');
      process.exit(0);
    });
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down MQTT broker...');
  tcpServer.close(() => {
    httpServer.close(() => {
      console.log('✅ MQTT broker closed');
      process.exit(0);
    });
  });
});

console.log('📡 MQTT Broker is running. Press Ctrl+C to stop.\n');
