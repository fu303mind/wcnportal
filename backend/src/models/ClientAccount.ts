import mongoose, { Document } from 'mongoose';

export interface ClientAccountDocument extends Document {
  name: string;
  slug: string;
  industry?: string;
  status: 'active' | 'onboarding' | 'inactive';
  primaryContactEmail?: string;
  metadata?: Record<string, unknown>;
}

const clientAccountSchema = new mongoose.Schema<ClientAccountDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    industry: String,
    status: {
      type: String,
      enum: ['active', 'onboarding', 'inactive'],
      default: 'onboarding'
    },
    primaryContactEmail: String,
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

const ClientAccount = mongoose.model<ClientAccountDocument>('ClientAccount', clientAccountSchema);

export default ClientAccount;
