import bcrypt from 'bcryptjs';
import mongoose, { Document, Model } from 'mongoose';

export type UserRole = 'admin' | 'client' | 'manager' | 'staff';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
}

export interface UserDocument extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  clientAccount?: mongoose.Types.ObjectId;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  failedLoginAttempts: number;
  lockoutUntil?: Date;
  passwordChangedAt?: Date;
  lastLoginAt?: Date;
  preferences: UserPreferences;
  activityLog: Array<{
    action: string;
    ip?: string;
    userAgent?: string;
    createdAt: Date;
  }>;
  comparePassword: (candidate: string) => Promise<boolean>;
  resetLocks: () => void;
}

interface UserModel extends Model<UserDocument> {
  isEmailTaken(email: string, excludeUserId?: string): Promise<boolean>;
}

const activityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    ip: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema<UserDocument, UserModel>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'client', 'manager', 'staff'],
      default: 'client'
    },
    clientAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientAccount'
    },
    isEmailVerified: { type: Boolean, default: false },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, select: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: Date },
    passwordChangedAt: { type: Date },
    lastLoginAt: { type: Date },
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      notifications: { type: Boolean, default: true }
    },
    activityLog: {
      type: [activityLogSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = new Date();
  return next();
});

userSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.resetLocks = function () {
  this.failedLoginAttempts = 0;
  this.lockoutUntil = undefined;
};

userSchema.statics.isEmailTaken = async function (email: string, excludeUserId?: string) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

userSchema.set('toJSON', {
  getters: true,
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.mfaSecret;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.model<UserDocument, UserModel>('User', userSchema);

export default User;
