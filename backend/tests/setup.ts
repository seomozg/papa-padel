import 'dotenv/config';
import path from 'path';

// Load test environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.test') });

const { PrismaClient } = require('../src/generated/prisma/client');

const prisma = new PrismaClient();

beforeAll(async () => {
  // Connect to test database
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clear database
  await prisma.like.deleteMany();
  await prisma.review.deleteMany();
  await prisma.court.deleteMany();
  await prisma.user.deleteMany();
});