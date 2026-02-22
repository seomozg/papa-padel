import request from 'supertest';
import express from 'express';
import { mapsRouter } from './maps.routes';

const app = express();
app.use(express.json());
app.use('/maps', mapsRouter);

describe('Maps Module', () => {
  describe('GET /maps/directions', () => {
    it('should return directions between two points', async () => {
      const response = await request(app)
        .get('/maps/directions?from=55.751244,37.618423&to=59.934280,30.335099')
        .expect(200);

      expect(response.body).toHaveProperty('routes');
      expect(Array.isArray(response.body.routes)).toBe(true);
    });

    it('should return error for invalid coordinates', async () => {
      const response = await request(app)
        .get('/maps/directions?from=invalid&to=59.934280,30.335099')
        .expect(400);

      expect(response.body.message).toBe('Invalid coordinates format. Use: lat,lng');
    });

    it('should return error when missing parameters', async () => {
      const response = await request(app)
        .get('/maps/directions?from=55.751244,37.618423')
        .expect(400);

      expect(response.body.message).toBe('Missing required parameters: from and to');
    });
  });
});