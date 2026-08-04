import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/db', async (req, res) => {
  try {
    await prisma.$connect();
    
    res.json({
      success: true,
      message: 'Database connection successful'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

export default router;
