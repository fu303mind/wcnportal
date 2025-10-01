import { Router } from 'express';
import upload from '@/middleware/upload';
import { authenticate } from '@/middleware/authMiddleware';
import {
  deleteDocumentController,
  downloadDocumentController,
  listDocumentsController,
  uploadDocumentController
} from '@/controllers/documentController';

const router = Router();

router.get('/', authenticate, listDocumentsController);
router.post('/', authenticate, upload.single('file'), uploadDocumentController);
router.get('/:id/download', authenticate, downloadDocumentController);
router.delete('/:id', authenticate, deleteDocumentController);

export default router;
