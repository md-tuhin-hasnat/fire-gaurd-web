'use client';

import { useState, useEffect } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { useSession } from 'next-auth/react';

interface Device {
  _id: string;
  deviceId: string;
  roomNo: string;
  floorNo: string;
  staticDangerLevel: number;
  status: string;
}

export default function SimulatorPage() {
  const { data: session } = useSession();
  const [client, setClient] = useState<MqttClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [fireDetection, setFireDetection] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [humanCount, setHumanCount] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishInterval, setPublishInterval] = useState<NodeJS.Timeout | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  // Fetch registered devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch('/api/simulator/devices');
        if (response.ok) {
          const data = await response.json();
          setDevices(data.devices || []);
          if (data.devices && data.devices.length > 0) {
            setSelectedDevice(data.devices[0].deviceId);
            addLog(`📋 Loaded ${data.devices.length} registered devices`);
          } else {
            addLog('⚠️  No registered devices found. Please register a device first.');
          }
        }
      } catch (error) {
        addLog('❌ Failed to fetch devices');
      }
    };

    fetchDevices();
  }, []);

  useEffect(() => {
    // Connect to MQTT broker via WebSocket
    const mqttClient = mqtt.connect('ws://localhost:8883');

    mqttClient.on('connect', () => {
      setConnected(true);
      setClient(mqttClient);
      addLog('✅ Connected to MQTT broker');
    });

    mqttClient.on('error', (error) => {
      addLog(`❌ MQTT Error: ${error.message}`);
    });

    mqttClient.on('close', () => {
      setConnected(false);
      addLog('🔌 Disconnected from MQTT broker');
    });

    return () => {
      if (publishInterval) {
        clearInterval(publishInterval);
      }
      mqttClient.end();
    };
  }, []);

  const publishData = () => {
    if (!client || !connected) {
      addLog('❌ Not connected to MQTT broker');
      return;
    }

    const payload = {
      id: selectedDevice,
      fireDetection: fireDetection,
      confidence: confidence,
      human: humanCount,
      timestamp: new Date().toISOString(),
    };

    const topic = `devices/${selectedDevice}/data`;
    client.publish(topic, JSON.stringify(payload), (error) => {
      if (error) {
        addLog(`❌ Publish failed: ${error.message}`);
      } else {
        addLog(
          `📤 Published to ${topic}: Fire=${fireDetection}, Conf=${confidence}%, Humans=${humanCount}`
        );
      }
    });
  };

  const startAutoPublish = () => {
    if (isPublishing) {
      // Stop publishing
      if (publishInterval) {
        clearInterval(publishInterval);
        setPublishInterval(null);
      }
      setIsPublishing(false);
      addLog('⏸️  Auto-publish stopped');
    } else {
      // Start publishing every 5 seconds
      const interval = setInterval(() => {
        publishData();
      }, 5000);
      setPublishInterval(interval);
      setIsPublishing(true);
      addLog('▶️  Auto-publish started (every 5 seconds)');
      publishData(); // Publish immediately
    }
  };

  const simulateFire = () => {
    setFireDetection(1);
    setConfidence(Math.floor(Math.random() * 30) + 70); // 70-100%
    setHumanCount(Math.floor(Math.random() * 10) + 1); // 1-10 people
    addLog('🔥 Fire scenario activated!');
    setTimeout(() => publishData(), 100);
  };

  const simulateNormal = () => {
    setFireDetection(0);
    setConfidence(0);
    setHumanCount(Math.floor(Math.random() * 5));
    addLog('✅ Normal scenario activated');
    setTimeout(() => publishData(), 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🔥 IoT Device Simulator
              </h1>
              <p className="text-gray-600 mt-1">
                Simulate fire detection sensor data for testing
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  connected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm font-medium">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Device Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Registered Device
            </label>
            {devices.length === 0 ? (
              <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                ⚠️  No registered devices found. Please register a device from the company dashboard first.
              </div>
            ) : (
              <select
                value={selectedDevice}
                onChange={(e) => {
                  setSelectedDevice(e.target.value);
                  const device = devices.find(d => d.deviceId === e.target.value);
                  addLog(`🔄 Switched to device: ${e.target.value} (Floor ${device?.floorNo}, Room ${device?.roomNo})`);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={isPublishing}
              >
                {devices.map((device) => (
                  <option key={device._id} value={device.deviceId}>
                    {device.deviceId} - Floor {device.floorNo}, Room {device.roomNo}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Fire Detection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fire Detection
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFireDetection(0)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    fireDetection === 0
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  No Fire (0)
                </button>
                <button
                  onClick={() => setFireDetection(1)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    fireDetection === 1
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Fire! (1)
                </button>
              </div>
            </div>

            {/* Confidence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confidence: {confidence}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={confidence}
                onChange={(e) => setConfidence(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Human Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Human Count: {humanCount}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={humanCount}
                onChange={(e) => setHumanCount(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={simulateFire}
              className="px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition"
              disabled={!connected || devices.length === 0}
            >
              🔥 Simulate Fire
            </button>
            <button
              onClick={simulateNormal}
              className="px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition"
              disabled={!connected || devices.length === 0}
            >
              ✅ Normal State
            </button>
            <button
              onClick={publishData}
              className="px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
              disabled={!connected || devices.length === 0}
            >
              📤 Publish Once
            </button>
            <button
              onClick={startAutoPublish}
              className={`px-4 py-3 rounded-lg font-medium transition ${
                isPublishing
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
              disabled={!connected || devices.length === 0}
            >
              {isPublishing ? '⏸️  Stop Auto' : '▶️  Start Auto'}
            </button>
          </div>

          {/* Current State Display */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Current State
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Device:</span>
                <p className="font-mono font-bold">{selectedDevice}</p>
              </div>
              <div>
                <span className="text-gray-600">Fire:</span>
                <p
                  className={`font-bold ${
                    fireDetection === 1 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {fireDetection === 1 ? 'DETECTED' : 'None'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Confidence:</span>
                <p className="font-bold">{confidence}%</p>
              </div>
              <div>
                <span className="text-gray-600">Humans:</span>
                <p className="font-bold">{humanCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Activity Logs</h2>
            <button
              onClick={() => setLogs([])}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
            >
              Clear Logs
            </button>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-gray-500">No activity yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-green-400 mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            📝 Instructions
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Make sure the MQTT broker is running:{' '}
              <code className="bg-blue-100 px-1 rounded">node scripts/mqtt-broker.js</code>
            </li>
            <li>• Register devices from the company dashboard first</li>
            <li>• Select a registered device from the dropdown</li>
            <li>
              • Use "Simulate Fire" to trigger an immediate fire alert scenario
            </li>
            <li>
              • Use "Start Auto" to publish data every 5 seconds automatically
            </li>
            <li>
              • Monitor the logs to see data being published to the MQTT broker
            </li>
            <li>
              • Check company dashboard or fire service dashboard for alerts
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
