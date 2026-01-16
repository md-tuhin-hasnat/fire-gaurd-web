import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Device Warning Interface
 * Stores warnings for devices (e.g., offline warnings)
 */
export interface IDeviceWarning extends Document {
  deviceId: string;
  companyId: mongoose.Types.ObjectId;
  warningType: 'offline' | 'low_battery' | 'sensor_error' | 'connection_issue';
  message: string;
  isResolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceWarningSchema = new Schema<IDeviceWarning>(
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
    warningType: {
      type: String,
      enum: ['offline', 'low_battery', 'sensor_error', 'connection_issue'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
DeviceWarningSchema.index({ deviceId: 1, isResolved: 1 });
DeviceWarningSchema.index({ companyId: 1, isResolved: 1 });
DeviceWarningSchema.index({ createdAt: -1 });

const DeviceWarning: Model<IDeviceWarning> = 
  mongoose.models.DeviceWarning || mongoose.model<IDeviceWarning>('DeviceWarning', DeviceWarningSchema);

export default DeviceWarning;
