import mongoose from 'mongoose';
import User from '@/models/User';
import Workflow from '@/models/Workflow';
import Document from '@/models/Document';

export const searchAll = async (userId: string, query: string) => {
  const regex = new RegExp(query, 'i');
  const ownerId = new mongoose.Types.ObjectId(userId);

  const [users, workflows, documents] = await Promise.all([
    User.find({ $or: [{ firstName: regex }, { lastName: regex }, { email: regex }] }).limit(5),
    Workflow.find({ owner: ownerId, $or: [{ title: regex }, { description: regex }] }).limit(5),
    Document.find({ owner: ownerId, originalName: regex }).limit(5)
  ]);

  return {
    users,
    workflows,
    documents
  };
};
