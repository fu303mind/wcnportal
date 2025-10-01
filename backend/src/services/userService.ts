import { FilterQuery } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import User, { UserDocument, UserRole } from '@/models/User';
import { validatePassword } from '@/utils/passwordPolicy';
import { recordActivity } from './auditService';

interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
}

export const listUsers = async ({ page = 1, limit = 10, search, role }: PaginationOptions) => {
  const filter: FilterQuery<UserDocument> = {};
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  if (role) {
    filter.role = role;
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter)
  ]);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};

export const getUserById = async (id: string) => User.findById(id);

interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  preferences?: Partial<UserDocument['preferences']>;
}

export const updateProfile = async (id: string, payload: UpdateProfileInput) => {
  const user = await User.findById(id);
  if (!user) {
    const error: any = new Error('User not found');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  if (payload.firstName) user.firstName = payload.firstName;
  if (payload.lastName) user.lastName = payload.lastName;
  if (payload.preferences) {
    user.preferences = { ...user.preferences, ...payload.preferences };
  }

  await user.save();

  await recordActivity({
    user: user._id.toString(),
    action: 'user_profile_updated'
  });

  return user.toJSON();
};

export const changePassword = async (id: string, currentPassword: string, newPassword: string) => {
  const passwordCheck = validatePassword(newPassword);
  if (!passwordCheck.valid) {
    const error: any = new Error(passwordCheck.message);
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  const user = await User.findById(id).select('+password');
  if (!user) {
    const error: any = new Error('User not found');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  const match = await user.comparePassword(currentPassword);
  if (!match) {
    const error: any = new Error('Current password is incorrect');
    error.statusCode = StatusCodes.UNAUTHORIZED;
    throw error;
  }

  user.password = newPassword;
  user.resetLocks();
  await user.save();

  await recordActivity({
    user: user._id.toString(),
    action: 'user_password_changed'
  });
};

export const updateUserRole = async (targetUserId: string, role: UserRole) => {
  const user = await User.findById(targetUserId);
  if (!user) {
    const error: any = new Error('User not found');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  user.role = role;
  await user.save();

  await recordActivity({
    user: user._id.toString(),
    action: 'user_role_updated',
    metadata: { role }
  });

  return user.toJSON();
};
