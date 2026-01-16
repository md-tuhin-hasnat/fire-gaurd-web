import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Traffic Police Station Interface
 * Represents a traffic police station/checkpoint that receives SMS alerts
 * for road clearance when fire service is en route
 */
export interface ITrafficPolice extends Document {
  stationName: string;
  stationCode: string;
  contactPhone: string; // SMS will be sent to this number
  contactEmail?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  jurisdiction: {
    type: 'Polygon' | 'Point';
    coordinates: number[][] | [number, number]; // Polygon or Point for coverage area
  };
  coverageArea: string; // Human-readable description (e.g., "Mirpur-10 to Mirpur-12")
  city: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TrafficPoliceSchema = new Schema<ITrafficPolice>(
  {
    stationName: {
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
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      lowercase: true,
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
      },
    },
    jurisdiction: {
      type: {
        type: String,
        enum: ['Polygon', 'Point'],
        required: true,
      },
      coordinates: {
        type: Schema.Types.Mixed,
        required: true,
      },
    },
    coverageArea: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
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

// Geospatial indexes for finding stations along route
TrafficPoliceSchema.index({ 'location.coordinates': '2dsphere' });
TrafficPoliceSchema.index({ 'jurisdiction.coordinates': '2dsphere' });
TrafficPoliceSchema.index({ stationCode: 1 });
TrafficPoliceSchema.index({ isActive: 1 });
TrafficPoliceSchema.index({ city: 1 });

const TrafficPolice: Model<ITrafficPolice> = 
  mongoose.models.TrafficPolice || mongoose.model<ITrafficPolice>('TrafficPolice', TrafficPoliceSchema);

export default TrafficPolice;
