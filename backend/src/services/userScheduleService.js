import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_SCHEDULE = [
  { day: 'Sen', items: ['Medikal Bedah — 60 mnt', 'Bank Soal — 30 soal'] },
  { day: 'Sel', items: ['Farmakologi — 45 mnt'] },
  { day: 'Rab', items: ['Simulasi CBT — 90 mnt'] },
  { day: 'Kam', items: ['Keperawatan Anak — 60 mnt'] },
  { day: 'Jum', items: ['Maternitas — 45 mnt', 'Pembahasan'] },
  { day: 'Sab', items: ['Simulasi CBT — 90 mnt'] },
  { day: 'Min', items: ['Review Bookmark'] },
];

class UserScheduleService {
  // Return existing schedule, or create with the balanced default if none exists.
  async getSchedule(userId) {
    let record = await prisma.userSchedule.findUnique({ where: { userId } });
    if (!record) {
      record = await prisma.userSchedule.create({
        data: { userId, schedule: DEFAULT_SCHEDULE },
      });
    }
    return record;
  }

  // Save/replace the user's schedule.
  async upsertSchedule(userId, schedule) {
    return await prisma.userSchedule.upsert({
      where: { userId },
      update: { schedule, updatedAt: new Date() },
      create: { userId, schedule },
    });
  }
}

export default new UserScheduleService();