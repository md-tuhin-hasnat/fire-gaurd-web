/**
 * MQTT Broker using Aedes
 * Self-hosted MQTT broker for IoT device communication
 * Run standalone with: npm run mqtt
 * Or integrate into Next.js API routes
 */

import createAedes from 'aedes';
import type { Client } from 'aedes';
import { createServer } from 'aedes-server-factory';
import { createServer as createWebSocketServer } from 'http';
import ws from 'websocket-stream';

const MQTT_PORT = parseInt(process.env.MQTT_BROKER_PORT || '1883');
const WS_PORT = parseInt(process.env.MQTT_WEBSOCKET_PORT || '8883');

let brokerInstance: ReturnType<typeof createAedes> | null = null;

/**
 * Create and configure MQTT broker
 */
export function createMQTTBroker(): ReturnType<typeof createAedes> {
  if (brokerInstance) {
    return brokerInstance;
  }

  const broker = createAedes({
    id: 'fire-guard-broker',
  });

  // Event: Client connected
  broker.on('client', (client: Client) => {
    console.log(`📡 MQTT Client connected: ${client.id}`);
  });

  // Event: Client disconnected
  broker.on('clientDisconnect', (client: Client) => {
    console.log(`📡 MQTT Client disconnected: ${client.id}`);
  });

  // Event: Message published
  broker.on('publish', (packet: any, client: any) => {
    if (client) {
      console.log(
        `📨 Message from ${client.id} to topic: ${packet.topic}`
      );
    }
  });

  // Event: Client subscribed to topic
  broker.on('subscribe', (subscriptions: any, client: any) => {
    console.log(
      `📬 Client ${client.id} subscribed to: ${subscriptions.map((s: any) => s.topic).join(', ')}`
    );
  });

  brokerInstance = broker;
  return broker;
}

/**
 * Start MQTT broker with TCP and WebSocket transports
 */
export function startMQTTBroker() {
  const broker = createMQTTBroker();

  // TCP Server (for IoT devices)
  const tcpServer = createServer(broker);
  tcpServer.listen(MQTT_PORT, () => {
    console.log(`🚀 MQTT Broker (TCP) listening on port ${MQTT_PORT}`);
  });

  // WebSocket Server (for browser clients)
  const httpServer = createWebSocketServer();
  ws.createServer({ server: httpServer }, broker.handle);
  httpServer.listen(WS_PORT, () => {
    console.log(`🚀 MQTT Broker (WebSocket) listening on port ${WS_PORT}`);
  });

  return { broker, tcpServer, httpServer };
}

// Run broker if executed directly
if (require.main === module) {
  console.log('🔥 Starting Fire Guard MQTT Broker...\n');
  startMQTTBroker();
}

export default createMQTTBroker;
