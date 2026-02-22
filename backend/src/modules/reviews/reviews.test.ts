import request from 'supertest';
import express from 'express';
import { authRouter } from '../auth/auth.routes';
import { courtsRouter } from '../courts/courts.routes';
import { reviewsRouter } from './reviews.routes';

const app = express();
app.use(express.json());
app.use('/auth', authRouter);
app.use('/courts', courtsRouter);
app.use('/reviews', reviewsRouter);

describe('Reviews Module', () => {
  describe('POST /reviews', () => {
    it('should create a new review', async () => {
      // First create a user and court for the review
      const userResponse = await request(app)
        .post('/auth/register')
        .send({
          email: 'reviewer@example.com',
          password: 'password123',
          name: 'Reviewer User'
        });

      const userId = userResponse.body.user.id;

      const courtResponse = await request(app)
        .post('/courts')
        .send({
          name: 'Review Court',
          city: 'Москва',
          address: 'Review Address',
          coordinates: { lat: 55.751244, lng: 37.618423 },
          type: 'indoor',
          amenities: ['Парковка'],
          phone: '+7 (495) 123-45-67',
          workingHours: '07:00 – 23:00',
          description: 'Court for reviews',
          prices: [{ time: '07:00 – 12:00', weekday: 1500, weekend: 2000 }],
          image: 'review.jpg'
        });

      const courtId = courtResponse.body.id;

      const reviewData = {
        courtId,
        userId,
        rating: 5,
        text: 'Отличный корт! Очень рекомендую.'
      };

      const response = await request(app)
        .post('/reviews')
        .send(reviewData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.rating).toBe(reviewData.rating);
      expect(response.body.text).toBe(reviewData.text);
      expect(response.body.courtId).toBe(courtId);
      expect(response.body.userId).toBe(userId);
    });
  });

  describe('GET /courts/:courtId/reviews', () => {
    it('should return reviews for a court', async () => {
      // Create court first
      const courtResponse = await request(app)
        .post('/courts')
        .send({
          name: 'Court with Reviews',
          city: 'СПб',
          address: 'SPb Address',
          coordinates: { lat: 59.934280, lng: 30.335099 },
          type: 'outdoor',
          amenities: ['Wi-Fi'],
          phone: '+7 (812) 987-65-43',
          workingHours: '08:00 – 22:00',
          description: 'Court with reviews',
          prices: [{ time: '08:00 – 12:00', weekday: 1200, weekend: 1600 }],
          image: 'reviews.jpg'
        });

      const courtId = courtResponse.body.id;

      // Create a review for the court
      const userResponse = await request(app)
        .post('/auth/register')
        .send({
          email: 'court-reviewer@example.com',
          password: 'password123',
          name: 'Court Reviewer'
        });

      const userId = userResponse.body.user.id;

      await request(app)
        .post('/reviews')
        .send({
          courtId,
          userId,
          rating: 4,
          text: 'Good court for reviews test'
        });

      const response = await request(app)
        .get(`/courts/${courtId}/reviews`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /reviews/:id', () => {
    it('should update a review', async () => {
      // Create review first
      const userResponse = await request(app)
        .post('/auth/register')
        .send({
          email: 'updater@example.com',
          password: 'password123',
          name: 'Updater User'
        });

      const userId = userResponse.body.user.id;

      const courtResponse = await request(app)
        .post('/courts')
        .send({
          name: 'Update Court',
          city: 'Казань',
          address: 'Update Address',
          coordinates: { lat: 55.796391, lng: 49.108891 },
          type: 'mixed',
          amenities: ['Кафе'],
          phone: '+7 (843) 234-56-78',
          workingHours: '09:00 – 22:00',
          description: 'Court for update',
          prices: [{ time: '09:00 – 13:00', weekday: 900, weekend: 1200 }],
          image: 'update.jpg'
        });

      const courtId = courtResponse.body.id;

      const reviewResponse = await request(app)
        .post('/reviews')
        .send({
          courtId,
          userId,
          rating: 4,
          text: 'Хороший корт'
        });

      const reviewId = reviewResponse.body.id;

      const updateData = {
        rating: 5,
        text: 'Отличный корт! Обновленный отзыв.'
      };

      const response = await request(app)
        .put(`/reviews/${reviewId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.rating).toBe(updateData.rating);
      expect(response.body.text).toBe(updateData.text);
    });
  });

  describe('DELETE /reviews/:id', () => {
    it('should delete a review', async () => {
      // Create review first
      const userResponse = await request(app)
        .post('/auth/register')
        .send({
          email: 'deleter@example.com',
          password: 'password123',
          name: 'Deleter User'
        });

      const userId = userResponse.body.user.id;

      const courtResponse = await request(app)
        .post('/courts')
        .send({
          name: 'Delete Court',
          city: 'Екатеринбург',
          address: 'Delete Address',
          coordinates: { lat: 56.838011, lng: 60.597474 },
          type: 'indoor',
          amenities: ['Wi-Fi'],
          phone: '+7 (343) 345-67-89',
          workingHours: '08:00 – 23:00',
          description: 'Court for deletion',
          prices: [{ time: '08:00 – 12:00', weekday: 1000, weekend: 1400 }],
          image: 'delete.jpg'
        });

      const courtId = courtResponse.body.id;

      const reviewResponse = await request(app)
        .post('/reviews')
        .send({
          courtId,
          userId,
          rating: 3,
          text: 'Средний корт'
        });

      const reviewId = reviewResponse.body.id;

      await request(app)
        .delete(`/reviews/${reviewId}`)
        .expect(204);

      // Verify review is deleted
      const getResponse = await request(app)
        .get(`/courts/${courtId}/reviews/${reviewId}`)
        .expect(404);
    });
  });
});