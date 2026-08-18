import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_SETTINGS = { sessionGoal: 8, scoreGoal: 85 };

class UserSettingsService {
  // Return existing settings, or create with defaults if none exist.
  async getSettings(userId) {
    let settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId, ...DEFAULT_SETTINGS },
      });
    }
    return settings;
  }

  // Upsert the user's settings.
  async upsertSettings(userId, sessionGoal, scoreGoal) {
    const data = {
      sessionGoal,
      scoreGoal,
      updatedAt: new Date(),
    };
    return await prisma.userSettings.upsert({
      where: { userId },
      update: data,
      create: { userId, sessionGoal, scoreGoal },
    });
  }
}

export default new UserSettingsService();