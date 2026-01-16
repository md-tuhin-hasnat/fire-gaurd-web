import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Sensor Data Interface
 * Time-series data from IoT devices
 * Saved every 5 minutes OR immediately when fire is detected
 */
export interface ISensorData extends Document {
  deviceId: string;
  companyId: mongoose.Types.ObjectId;
  fireDetection: number; // 0 or 1
  confidence: number; // 0-100 percentage
  humanCount: number; // Number of people detected
  timestamp: Date;
  dynamicDangerLevel: number; // Calculated: staticLevel + (confidence * 0.6) + (humanCount * 0.4)
  createdAt: Date;
}

const SensorDataSchema = new Schema<ISensorData>(
  {
    deviceId: {
      type: String,
      required: true,
      ref: 'Device',
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    fireDetection: {
      type: Number,
      required: true,
      enum: [0, 1],
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    humanCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dynamicDangerLevel: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    // Time-series collection configuration (MongoDB 5.0+)
    timeseries: {
      timeField: 'timestamp',
      metaField: 'deviceId',
      granularity: 'minutes' as const,
    },
  }
);

// Indexes for efficient queries
SensorDataSchema.index({ deviceId: 1, timestamp: -1 });
SensorDataSchema.index({ companyId: 1, timestamp: -1 });
SensorDataSchema.index({ fireDetection: 1, timestamp: -1 });
SensorDataSchema.index({ timestamp: -1 });

const SensorData: Model<ISensorData> = 
  mongoose.models.SensorData || mongoose.model<ISensorData>('SensorData', SensorDataSchema);

export default SensorData;
