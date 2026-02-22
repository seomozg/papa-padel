import request from 'supertest';
import express from 'express';
import { courtsRouter } from './courts.routes';
import { prisma } from '../../config/database';

const app = express();
app.use(express.json());
app.use('/courts', courtsRouter);

describe('Courts Module', () => {
  describe('GET /courts', () => {
    it('should return list of courts', async () => {
      const response = await request(app)
        .get('/courts')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter courts by city', async () => {
      const response = await request(app)
        .get('/courts?city=Москва')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((court: any) => {
        expect(court.city).toBe('Москва');
      });
    });

    it('should filter courts by type', async () => {
      const response = await request(app)
        .get('/courts?type=indoor')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((court: any) => {
        expect(court.type).toBe('indoor');
      });
    });

    it('should sort courts by rating', async () => {
      const response = await request(app)
        .get('/courts?sort=rating')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      for (let i = 1; i < response.body.length; i++) {
        expect(response.body[i-1].rating).toBeGreaterThanOrEqual(response.body[i].rating);
      }
    });
  });

  describe('GET /courts/:id', () => {
    it('should return court details', async () => {
      // First create a court
      const createResponse = await request(app)
        .post('/courts')
        .send({
          name: 'Test Court',
          city: 'Москва',
          address: 'Test Address',
          coordinates: { lat: 55.751244, lng: 37.618423 },
          type: 'indoor',
          amenities: ['Парковка', 'Душевые'],
          phone: '+7 (495) 123-45-67',
          workingHours: '07:00 – 23:00',
          description: 'Test description',
          prices: [{ time: '07:00 – 12:00', weekday: 1500, weekend: 2000 }],
          image: 'test.jpg'
        })
        .expect(201);

      const courtId = createResponse.body.id;

      const response = await request(app)
        .get(`/courts/${courtId}`)
        .expect(200);

      expect(response.body.id).toBe(courtId);
      expect(response.body.name).toBe('Test Court');
      expect(response.body.city).toBe('Москва');
    });

    it('should return 404 for non-existent court', async () => {
      const response = await request(app)
        .get('/courts/non-existent-id')
        .expect(404);

      expect(response.body.message).toBe('Court not found');
    });
  });

  describe('POST /courts', () => {
    it('should create a new court', async () => {
      const courtData = {
        name: 'SPb Court',
        city: 'Санкт-Петербург',
        address: 'SPb Address',
        coordinates: { lat: 59.934280, lng: 30.335099 },
        type: 'outdoor',
        amenities: ['Wi-Fi'],
        phone: '+7 (812) 987-65-43',
        workingHours: '08:00 – 22:00',
        description: 'SPb court',
        prices: [{ time: '08:00 – 12:00', weekday: 1200, weekend: 1600 }],
        image: 'spb.jpg'
      };

      const response = await request(app)
        .post('/courts')
        .send(courtData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(courtData.name);
      expect(response.body.city).toBe(courtData.city);
      expect(response.body.type).toBe(courtData.type);
    });
  });
});