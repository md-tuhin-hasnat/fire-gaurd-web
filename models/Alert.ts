import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Alert Status
 * Tracks the lifecycle of a fire alert
 */
export type AlertStatus = 
  | 'pending'        // Alert created, waiting for fire station response
  | 'acknowledged'   // Fire station accepted the alert
  | 'en_route'       // Fire service is on the way
  | 'arrived'        // Fire service arrived at location
  | 'resolved'       // Incident resolved
  | 'false_alarm';   // Marked as false alarm

/**
 * Escalation History Entry
 * Tracks which fire stations were notified and their responses
 */
export interface IEscalationEntry {
  fireStationId: mongoose.Types.ObjectId;
  notifiedAt: Date;
  response?: 'accepted' | 'passed' | 'timeout';
  respondedAt?: Date;
  dangerLevelAtTime: number;
}

/**
 * Alert Interface
 * Represents a fire alert triggered by a device
 */
export interface IAlert extends Document {
  deviceId: string;
  companyId: mongoose.Types.ObjectId;
  fireStationId?: mongoose.Types.ObjectId; // Currently assigned fire station
  status: AlertStatus;
  dangerLevel: number; // Current danger level (can escalate)
  initialDangerLevel: number; // Original danger level when alert created
  confidence: number;
  humanCount: number;
  responseTimeout: number; // Timeout in milliseconds based on danger level
  escalationHistory: IEscalationEntry[];
  dismissedByCompany: boolean;
  dismissedAt?: Date;
  dismissedReason?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  smsNotificationsSent: number; // Count of SMS sent to traffic police
  createdAt: Date;
  updatedAt: Date;
}

const EscalationEntrySchema = new Schema<IEscalationEntry>(
  {
    fireStationId: {
      type: Schema.Types.ObjectId,
      ref: 'FireStation',
      required: true,
    },
    notifiedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    response: {
      type: String,
      enum: ['accepted', 'passed', 'timeout'],
    },
    respondedAt: {
      type: Date,
    },
    dangerLevelAtTime: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const AlertSchema = new Schema<IAlert>(
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
    fireStationId: {
      type: Schema.Types.ObjectId,
      ref: 'FireStation',
    },
    status: {
      type: String,
      enum: ['pending', 'acknowledged', 'en_route', 'arrived', 'resolved', 'false_alarm'],
      default: 'pending',
      required: true,
    },
    dangerLevel: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    initialDangerLevel: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
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
    responseTimeout: {
      type: Number,
      required: true,
    },
    escalationHistory: {
      type: [EscalationEntrySchema],
      default: [],
    },
    dismissedByCompany: {
      type: Boolean,
      default: false,
    },
    dismissedAt: {
      type: Date,
    },
    dismissedReason: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
    resolutionNotes: {
      type: String,
    },
    smsNotificationsSent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
AlertSchema.index({ deviceId: 1, createdAt: -1 });
AlertSchema.index({ companyId: 1, status: 1 });
AlertSchema.index({ fireStationId: 1, status: 1 });
AlertSchema.index({ status: 1, createdAt: -1 });
AlertSchema.index({ createdAt: -1 });

const Alert: Model<IAlert> = mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);

export default Alert;
