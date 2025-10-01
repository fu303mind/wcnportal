import { Router } from 'express';
import { body } from 'express-validator';
import {
  addTaskCommentController,
  addTaskController,
  createWorkflowController,
  getWorkflowController,
  listWorkflowsController,
  updateTaskStatusController,
  updateWorkflowController
} from '@/controllers/workflowController';
import { authenticate } from '@/middleware/authMiddleware';
import { handleValidation } from '@/middleware/validation';

const router = Router();

router.post(
  '/',
  authenticate,
  [
    body('title').isString().notEmpty(),
    body('clientAccount').isString().notEmpty(),
    handleValidation
  ],
  createWorkflowController
);

router.get('/', authenticate, listWorkflowsController);
router.get('/:id', authenticate, getWorkflowController);

router.patch('/:id', authenticate, updateWorkflowController);

router.post(
  '/:id/tasks',
  authenticate,
  [body('title').isString().notEmpty(), handleValidation],
  addTaskController
);

router.patch(
  '/:id/tasks/:taskId/status',
  authenticate,
  [body('status').isIn(['todo', 'in_progress', 'completed', 'blocked']), handleValidation],
  updateTaskStatusController
);

router.post(
  '/:id/tasks/:taskId/comments',
  authenticate,
  [body('message').isString().notEmpty(), handleValidation],
  addTaskCommentController
);

export default router;
