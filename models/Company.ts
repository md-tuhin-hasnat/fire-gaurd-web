import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Company Types
 * Different types of companies/facilities that may use the fire detection system
 */
export type CompanyType = 
  | 'garments'
  | 'oil_gas'
  | 'manufacturing'
  | 'warehouse'
  | 'hospital'
  | 'hotel'
  | 'shopping_mall'
  | 'office_building'
  | 'educational'
  | 'other';

/**
 * Location Interface
 * Geographic coordinates for company location
 */
export interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
}

/**
 * Company Interface
 * Represents a company/organization using the fire detection system
 */
export interface ICompany extends Document {
  name: string;
  companyType: CompanyType;
  location: ILocation;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  country: string;
  devices: mongoose.Types.ObjectId[]; // Reference to Device model
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
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
  { _id: false }
);

const CompanySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    companyType: {
      type: String,
      enum: [
        'garments',
        'oil_gas',
        'manufacturing',
        'warehouse',
        'hospital',
        'hotel',
        'shopping_mall',
        'office_building',
        'educational',
        'other',
      ],
      required: true,
    },
    location: {
      type: LocationSchema,
      required: true,
    },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      required: true,
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
    country: {
      type: String,
      required: true,
      default: 'Bangladesh',
    },
    devices: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Device',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for location-based queries
CompanySchema.index({ 'location.coordinates': '2dsphere' });
CompanySchema.index({ companyType: 1 });
CompanySchema.index({ isActive: 1 });

const Company: Model<ICompany> = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);

export default Company;
