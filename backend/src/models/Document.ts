import mongoose, { Document as MongooseDocument } from 'mongoose';

export interface StoredDocument extends MongooseDocument {
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  owner: mongoose.Types.ObjectId;
  workflow?: mongoose.Types.ObjectId;
  clientAccount?: mongoose.Types.ObjectId;
  storagePath: string;
  checksum: string;
  createdAt: Date;
}

const documentSchema = new mongoose.Schema<StoredDocument>(
  {
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workflow: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow' },
    clientAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientAccount' },
    storagePath: { type: String, required: true },
    checksum: { type: String, required: true },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

const Document = mongoose.model<StoredDocument>('Document', documentSchema);

export default Document;
