import mongoose, { Schema, Document, Model } from 'mongoose';
import { ILocation } from './Company';

/**
 * Fire Station Interface
 * Represents a fire department/station that responds to alerts
 */
export interface IFireStation extends Document {
  name: string;
  stationCode: string; // Unique code for the station
  location: ILocation;
  coverageRadius: number; // Coverage area in kilometers
  contactPhone: string;
  contactEmail: string;
  address: string;
  city: string;
  availableVehicles: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FireStationSchema = new Schema<IFireStation>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    stationCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (v: number[]) {
            return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
          },
          message: 'Coordinates must be [longitude, latitude] with valid ranges',
        },
      },
      address: String,
    },
    coverageRadius: {
      type: Number,
      required: true,
      default: 10, // 10 km default coverage
      min: 1,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    availableVehicles: {
      type: Number,
      default: 2,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for finding nearest fire stations
FireStationSchema.index({ 'location.coordinates': '2dsphere' });
// Note: stationCode already has unique index from schema definition
FireStationSchema.index({ isActive: 1 });
FireStationSchema.index({ city: 1 });

const FireStation: Model<IFireStation> = 
  mongoose.models.FireStation || mongoose.model<IFireStation>('FireStation', FireStationSchema);

export default FireStation;
