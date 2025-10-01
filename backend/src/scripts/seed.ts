import logger from '@/config/logger';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import User from '@/models/User';
import ClientAccount from '@/models/ClientAccount';

const run = async () => {
  try {
    await connectDatabase();

    const client = await ClientAccount.findOneAndUpdate(
      { slug: 'demo-client' },
      {
        name: 'Demo Client',
        slug: 'demo-client',
        status: 'active',
        primaryContactEmail: 'client@example.com'
      },
      { upsert: true, new: true }
    );

    // Delete existing users to ensure clean seed
    await User.deleteOne({ email: 'admin@portal.com' });
    await User.deleteOne({ email: 'client@portal.com' });

    // Create admin user (will trigger password hashing)
    await User.create({
      email: 'admin@portal.com',
      password: 'ChangeMeNow!123',
      firstName: 'Portal',
      lastName: 'Admin',
      role: 'admin',
      isEmailVerified: true
    });

    // Create client user (will trigger password hashing)
    await User.create({
      email: 'client@portal.com',
      password: 'ChangeMeNow!123',
      firstName: 'Demo',
      lastName: 'Client',
      role: 'client',
      clientAccount: client._id,
      isEmailVerified: true
    });

    logger.info('Database seeded successfully');
  } catch (error) {
    logger.error('Seed script failed', error as Error);
  } finally {
    await disconnectDatabase();
  }
};

run();
