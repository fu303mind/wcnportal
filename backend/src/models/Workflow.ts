import mongoose, { Document } from 'mongoose';

export interface Task {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  assignee?: mongoose.Types.ObjectId;
  status: 'todo' | 'in_progress' | 'completed' | 'blocked';
  dueDate?: Date;
  completedAt?: Date;
  comments: Array<{
    author: mongoose.Types.ObjectId;
    message: string;
    createdAt: Date;
  }>;
}

export interface WorkflowHistoryEntry {
  version: number;
  changes: string;
  updatedAt: Date;
  updatedBy: mongoose.Types.ObjectId;
}

export interface WorkflowDocument extends Document {
  title: string;
  description?: string;
  clientAccount: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  progress: number;
  tasks: Task[];
  tags: string[];
  version: number;
  history: WorkflowHistoryEntry[];
  documents: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema<Task>(
  {
    title: { type: String, required: true },
    description: String,
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'completed', 'blocked'],
      default: 'todo'
    },
    dueDate: Date,
    completedAt: Date,
    comments: { type: [commentSchema], default: [] }
  },
  { timestamps: true }
);

const historySchema = new mongoose.Schema<WorkflowHistoryEntry>(
  {
    version: { type: Number, required: true },
    changes: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { _id: false }
);

const workflowSchema = new mongoose.Schema<WorkflowDocument>(
  {
    title: { type: String, required: true },
    description: String,
    clientAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientAccount', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['draft', 'in_progress', 'completed', 'archived'],
      default: 'draft'
    },
    progress: { type: Number, default: 0 },
    tasks: { type: [taskSchema], default: [] },
    tags: { type: [String], default: [] },
    version: { type: Number, default: 1 },
    history: { type: [historySchema], default: [] },
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }]
  },
  { timestamps: true }
);

workflowSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Workflow = mongoose.model<WorkflowDocument>('Workflow', workflowSchema);

export default Workflow;
