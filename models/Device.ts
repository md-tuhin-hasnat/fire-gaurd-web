import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Device Status
 * - active: Device is registered and should be online
 * - inactive: Device is deactivated by admin
 * - offline: Device hasn't sent data within threshold time
 */
export type DeviceStatus = 'active' | 'inactive' | 'offline';

/**
 * Device Interface
 * Represents an IoT fire detection device
 */
export interface IDevice extends Document {
  deviceId: string; // Unique identifier printed on device
  activationKeyHash: string; // Hashed activation key for security
  companyId: mongoose.Types.ObjectId;
  roomNo: string;
  floorNo: string;
  staticDangerLevel: number; // 0-100, based on room type/contents
  status: DeviceStatus;
  lastSeenAt: Date; // Last time device sent data
  isRegistered: boolean; // False until company registers it
  registeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    activationKeyHash: {
      type: String,
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: function (this: IDevice) {
        return this.isRegistered;
      },
    },
    roomNo: {
      type: String,
      trim: true,
      required: function (this: IDevice) {
        return this.isRegistered;
      },
    },
    floorNo: {
      type: String,
      trim: true,
      required: function (this: IDevice) {
        return this.isRegistered;
      },
    },
    staticDangerLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 30, // Default to Normal level
      required: function (this: IDevice) {
        return this.isRegistered;
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'offline'],
      default: 'inactive',
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
    isRegistered: {
      type: Boolean,
      default: false,
    },
    registeredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
DeviceSchema.index({ deviceId: 1 });
DeviceSchema.index({ companyId: 1 });
DeviceSchema.index({ status: 1 });
DeviceSchema.index({ lastSeenAt: 1 });
DeviceSchema.index({ isRegistered: 1 });

/**
 * Check if device is offline
 * Device is considered offline if lastSeenAt > DEVICE_OFFLINE_THRESHOLD
 */
DeviceSchema.methods.isOffline = function (): boolean {
  if (!this.lastSeenAt) return true;
  const threshold = parseInt(process.env.DEVICE_OFFLINE_THRESHOLD || '120000');
  return Date.now() - this.lastSeenAt.getTime() > threshold;
};

const Device: Model<IDevice> = mongoose.models.Device || mongoose.model<IDevice>('Device', DeviceSchema);

export default Device;
