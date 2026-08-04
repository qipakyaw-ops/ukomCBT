import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

class UserService {
  async createUser(name, email, password, role = 'student') {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return user;
  }

  async findByEmail(email) {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    return user;
  }

  async findById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return user;
  }

  async verifyPassword(password, passwordHash) {
    return await bcrypt.compare(password, passwordHash);
  }
}

export default new UserService();
