import express from 'express';
import { prisma } from '../../config/database';

const router = express.Router();

// POST /reviews - создать отзыв (поддержка анонимных отзывов)
router.post('/', async (req, res) => {
  try {
    const { courtId, userId, authorName, rating, text } = req.body;

    const review = await prisma.review.create({
      data: {
        courtId,
        userId: userId || null,
        authorName: authorName || null,
        rating,
        text
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    // Update court rating and review count
    const courtReviews = await prisma.review.findMany({
      where: { courtId },
      select: { rating: true }
    });

    const avgRating = courtReviews.reduce((sum, r) => sum + r.rating, 0) / courtReviews.length;

    await prisma.court.update({
      where: { id: courtId },
      data: {
        rating: avgRating,
        reviewCount: courtReviews.length
      }
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /courts/:courtId/reviews - отзывы для корта
router.get('/courts/:courtId/reviews', async (req, res) => {
  try {
    const { courtId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { courtId },
      include: {
        user: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /reviews/:id - обновить отзыв
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, text } = req.body;

    const review = await prisma.review.update({
      where: { id },
      data: { rating, text },
      include: {
        user: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    // Update court rating
    const courtReviews = await prisma.review.findMany({
      where: { courtId: review.courtId },
      select: { rating: true }
    });

    const avgRating = courtReviews.reduce((sum, r) => sum + r.rating, 0) / courtReviews.length;

    await prisma.court.update({
      where: { id: review.courtId },
      data: { rating: avgRating }
    });

    res.json(review);
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /reviews/:id - удалить отзыв
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id }
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await prisma.review.delete({
      where: { id }
    });

    // Update court rating and review count
    const courtReviews = await prisma.review.findMany({
      where: { courtId: review.courtId },
      select: { rating: true }
    });

    const avgRating = courtReviews.length > 0
      ? courtReviews.reduce((sum, r) => sum + r.rating, 0) / courtReviews.length
      : 0;

    await prisma.court.update({
      where: { id: review.courtId },
      data: {
        rating: avgRating,
        reviewCount: courtReviews.length
      }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /courts/:courtId/reviews/:reviewId - отдельный отзыв (для теста)
router.get('/courts/:courtId/reviews/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export { router as reviewsRouter };