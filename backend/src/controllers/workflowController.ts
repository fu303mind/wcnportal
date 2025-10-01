import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  addTask,
  addTaskComment,
  createWorkflow,
  getWorkflow,
  listWorkflows,
  updateTaskStatus,
  updateWorkflow
} from '@/services/workflowService';

export const createWorkflowController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }
  const workflow = await createWorkflow({ ...req.body, owner: req.user.id });
  res.status(StatusCodes.CREATED).json({ workflow });
};

export const listWorkflowsController = async (req: Request, res: Response) => {
  const result = await listWorkflows({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    status: req.query.status as string | undefined,
    clientAccount: req.query.clientAccount as string | undefined,
    search: req.query.search as string | undefined
  });
  res.status(StatusCodes.OK).json(result);
};

export const getWorkflowController = async (req: Request, res: Response) => {
  const workflow = await getWorkflow(req.params.id);
  res.status(StatusCodes.OK).json({ workflow });
};

export const updateWorkflowController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }
  const workflow = await updateWorkflow(req.params.id, req.user.id, req.body);
  res.status(StatusCodes.OK).json({ workflow });
};

export const addTaskController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }
  const workflow = await addTask(req.params.id, req.user.id, req.body);
  res.status(StatusCodes.OK).json({ workflow });
};

export const updateTaskStatusController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }
  const workflow = await updateTaskStatus(
    req.params.id,
    req.params.taskId,
    req.body.status,
    req.user.id
  );
  res.status(StatusCodes.OK).json({ workflow });
};

export const addTaskCommentController = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
  }
  const workflow = await addTaskComment(req.params.id, req.params.taskId, req.user.id, req.body.message);
  res.status(StatusCodes.OK).json({ workflow });
};
