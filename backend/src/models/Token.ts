import mongoose, { Document } from 'mongoose';

export type TokenType = 'email_verification' | 'password_reset' | 'refresh_token';

export interface TokenDocument extends Document {
  user: mongoose.Types.ObjectId;
  token: string;
  type: TokenType;
  expiresAt: Date;
  createdAt: Date;
  consumedAt?: Date;
}

const tokenSchema = new mongoose.Schema<TokenDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['email_verification', 'password_reset', 'refresh_token'],
      required: true
    },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date }
  },
  { timestamps: true }
);

tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Token = mongoose.model<TokenDocument>('Token', tokenSchema);

export default Token;
