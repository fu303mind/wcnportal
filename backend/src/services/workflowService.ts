import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import Workflow, { WorkflowDocument } from '@/models/Workflow';
import { recordActivity } from './auditService';

interface WorkflowInput {
  title: string;
  description?: string;
  clientAccount: string;
  owner: string;
  tags?: string[];
}

interface PaginationParams {
  page?: number;
  limit?: number;
  status?: string;
  clientAccount?: string;
  search?: string;
}

const calculateProgress = (workflow: WorkflowDocument) => {
  if (!workflow.tasks.length) {
    return 0;
  }
  const completed = workflow.tasks.filter((task) => task.status === 'completed').length;
  return Math.round((completed / workflow.tasks.length) * 100);
};

export const createWorkflow = async (input: WorkflowInput) => {
  const ownerId = new mongoose.Types.ObjectId(input.owner);
  const clientAccountId = new mongoose.Types.ObjectId(input.clientAccount);

  const workflow = await Workflow.create({
    ...input,
    owner: ownerId,
    clientAccount: clientAccountId,
    status: 'draft'
  });

  await recordActivity({
    user: input.owner,
    action: 'workflow_created',
    entityType: 'workflow',
    entityId: workflow._id.toString(),
    metadata: { title: input.title }
  });

  return workflow;
};

export const listWorkflows = async ({ page = 1, limit = 10, status, clientAccount, search }: PaginationParams) => {
  const query: mongoose.FilterQuery<WorkflowDocument> = {};

  if (status) query.status = status;
  if (clientAccount) query.clientAccount = new mongoose.Types.ObjectId(clientAccount);
  if (search) {
    query.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Workflow.find(query)
      .populate('owner', 'firstName lastName email')
      .populate('clientAccount', 'name slug')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    Workflow.countDocuments(query)
  ]);

  return {
    items: items.map((workflow) => ({
      ...workflow.toJSON(),
      progress: calculateProgress(workflow)
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};

export const getWorkflow = async (id: string) => {
  const workflow = await Workflow.findById(id)
    .populate('owner', 'firstName lastName email')
    .populate('tasks.assignee', 'firstName lastName email')
    .populate('clientAccount', 'name');

  if (!workflow) {
    const error: any = new Error('Workflow not found');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  return { ...workflow.toJSON(), progress: calculateProgress(workflow) };
};

interface UpdateWorkflowInput {
  title?: string;
  description?: string;
  status?: WorkflowDocument['status'];
  tags?: string[];
}

export const updateWorkflow = async (id: string, userId: string, payload: UpdateWorkflowInput) => {
  const workflow = await Workflow.findById(id);
  if (!workflow) {
    const error: any = new Error('Workflow not found');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  if (payload.title) workflow.title = payload.title;
  if (payload.description !== undefined) workflow.description = payload.description;
  if (payload.status) workflow.status = payload.status;
  if (payload.tags) workflow.tags = payload.tags;

  workflow.version += 1;
  workflow.history.push({
    version: workflow.version,
    changes: JSON.stringify(payload),
    updatedBy: new mongoose.Types.ObjectId(userId),
    updatedAt: new Date()
  });

  workflow.progress = calculateProgress(workflow);

  await workflow.save();

  await recordActivity({
    user: userId,
    action: 'workflow_updated',
    entityType: 'workflow',
    entityId: workflow._id.toString()
  });

  return { ...workflow.toJSON(), progress: workflow.progress };
};

interface TaskInput {
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: Date;
}

export const addTask = async (workflowId: string, userId: string, input: TaskInput) => {
  const workflow = await Workflow.findById(workflowId);
  if (!workflow) {
    const error: any = new Error('Workflow not found');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  workflow.tasks.push({
    title: input.title,
    description: input.description,
    assignee: input.assignee ? new mongoose.Types.ObjectId(input.assignee) : undefined,
    status: 'todo',
    dueDate: input.dueDate,
    comments: []
  } as any);

  workflow.progress = calculateProgress(workflow);
  workflow.version += 1;

  workflow.history.push({
    version: workflow.version,
    changes: `Added task ${input.title}`,
    updatedBy: new mongoose.Types.ObjectId(userId),
    updatedAt: new Date()
  });

  await workflow.save();

  await recordActivity({
    user: userId,
    action: 'workflow_task_added',
    entityType: 'workflow',
    entityId: workflow._id.toString(),
    metadata: { taskTitle: input.title }
  });

  return { ...workflow.toJSON(), progress: workflow.progress };
};

export const updateTaskStatus = async (
  workflowId: string,
  taskId: string,
  status: 'todo' | 'in_progress' | 'completed' | 'blocked',
  userId: string
) => {
  const workflow = await Workflow.findById(workflowId);
  if (!workflow) {
    const error: any = new Error('Workflow not found');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  const task = workflow.tasks.id(taskId);
  if (!task) {
    const error: any = new Error('Task not found');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  task.status = status;
  if (status === 'completed') {
    task.completedAt = new Date();
  }

  workflow.progress = calculateProgress(workflow);
  workflow.version += 1;
  workflow.history.push({
    version: workflow.version,
    changes: `Task ${task.title} moved to ${status}`,
    updatedBy: new mongoose.Types.ObjectId(userId),
    updatedAt: new Date()
  });

  await workflow.save();

  await recordActivity({
    user: userId,
    action: 'workflow_task_status_changed',
    entityType: 'workflow',
    entityId: workflow._id.toString(),
    metadata: { taskId, status }
  });

  return { ...workflow.toJSON(), progress: workflow.progress };
};

export const addTaskComment = async (workflowId: string, taskId: string, userId: string, message: string) => {
  const workflow = await Workflow.findById(workflowId);
  if (!workflow) {
    const error: any = new Error('Workflow not found');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  const task = workflow.tasks.id(taskId);
  if (!task) {
    const error: any = new Error('Task not found');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  task.comments.push({
    author: new mongoose.Types.ObjectId(userId),
    message,
    createdAt: new Date()
  });

  workflow.version += 1;
  workflow.history.push({
    version: workflow.version,
    changes: `Comment added to task ${task.title}`,
    updatedBy: new mongoose.Types.ObjectId(userId),
    updatedAt: new Date()
  });

  await workflow.save();

  await recordActivity({
    user: userId,
    action: 'workflow_task_comment_added',
    entityType: 'workflow',
    entityId: workflow._id.toString(),
    metadata: { taskId }
  });

  return workflow.toJSON();
};
