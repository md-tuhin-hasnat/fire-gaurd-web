import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * User Roles in the system
 * - super_admin: System-wide administrator with full access
 * - company_admin: Company administrator managing devices and viewing data
 * - fire_service: Fire department personnel responding to alerts
 */
export type UserRole = 'super_admin' | 'company_admin' | 'fire_service';

/**
 * User Interface
 * Represents a user in the fire guard system
 */
export interface IUser extends Document {
  email: string;
  password: string; // Hashed with bcryptjs
  name: string;
  role: UserRole;
  companyId?: mongoose.Types.ObjectId; // For company_admin role
  fireStationId?: mongoose.Types.ObjectId; // For fire_service role
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['super_admin', 'company_admin', 'fire_service'],
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: function (this: IUser) {
        return this.role === 'company_admin';
      },
    },
    fireStationId: {
      type: Schema.Types.ObjectId,
      ref: 'FireStation',
      required: function (this: IUser) {
        return this.role === 'fire_service';
      },
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

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ companyId: 1 });
UserSchema.index({ fireStationId: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
