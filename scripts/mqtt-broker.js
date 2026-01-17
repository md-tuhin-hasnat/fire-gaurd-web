const createAedes = require('aedes');
const { createServer } = require('net');
const { createServer: createHttpServer } = require('http');
const ws = require('websocket-stream');

const TCP_PORT = 1883;
const WS_PORT = 8883;

// Create Aedes broker
const broker = createAedes();

// TCP Server
const tcpServer = createServer(broker.handle);

tcpServer.listen(TCP_PORT, () => {
  console.log(`🔥 FireGuard MQTT Broker started`);
  console.log(`📡 TCP listening on port ${TCP_PORT}`);
});

// WebSocket Server
const httpServer = createHttpServer();
ws.createServer({ server: httpServer }, broker.handle);

httpServer.listen(WS_PORT, () => {
  console.log(`🌐 WebSocket listening on port ${WS_PORT}`);
  console.log('');
  console.log('✅ MQTT Broker is ready to accept connections');
  console.log('');
});

// Event handlers
broker.on('client', (client) => {
  console.log(`[${new Date().toISOString()}] Client connected: ${client.id}`);
});

broker.on('clientDisconnect', (client) => {
  console.log(`[${new Date().toISOString()}] Client disconnected: ${client.id}`);
});

broker.on('publish', (packet, client) => {
  if (client && packet.topic.startsWith('devices/')) {
    console.log(`[${new Date().toISOString()}] Message from ${client.id}: ${packet.topic}`);
  }
});

// Error handling
broker.on('clientError', (client, err) => {
  console.error(`[${new Date().toISOString()}] Client error (${client.id}):`, err.message);
});

tcpServer.on('error', (err) => {
  console.error('TCP Server error:', err);
  process.exit(1);
});

httpServer.on('error', (err) => {
  console.error('HTTP Server error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down MQTT broker...');
  tcpServer.close(() => {
    httpServer.close(() => {
      console.log('✅ MQTT broker stopped');
      process.exit(0);
    });
  });
});

console.log('');
console.log('FireGuard MQTT Broker');
console.log('====================');
console.log('');
