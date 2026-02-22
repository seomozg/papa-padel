import express from 'express';
import { prisma } from '../../config/database';
import { cacheMiddleware, invalidateCache } from '../../middleware/cache';

const router = express.Router();

// GET /courts - список кортов с фильтрами и сортировкой
router.get('/', cacheMiddleware(600), async (req, res) => { // Кэш на 10 минут
  try {
    const { city, type, sort, search } = req.query;

    let where: any = {};
    if (city && city !== 'Все города') {
      where.city = city;
    }
    if (type) {
      where.type = type;
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { city: { contains: search as string } },
        { address: { contains: search as string } }
      ];
    }

    let orderBy: any = {};
    if (sort === 'rating') {
      orderBy.rating = 'desc';
    } else if (sort === 'price_asc') {
      // For now, sort by rating as placeholder
      orderBy.rating = 'asc';
    } else if (sort === 'price_desc') {
      orderBy.rating = 'desc';
    } else if (sort === 'reviews') {
      orderBy.reviewCount = 'desc';
    }

    const courts = await prisma.court.findMany({
      where,
      orderBy
    });

    // Transform JSON fields to proper types
    const transformedCourts = courts.map(court => {
      try {
        return {
          ...court,
          coordinates: court.coordinates ? JSON.parse(court.coordinates as string) : null,
          amenities: court.amenities ? JSON.parse(court.amenities as string) : [],
          prices: court.prices ? JSON.parse(court.prices as string) : [],
          tags: court.tags ? JSON.parse(court.tags as string) : []
        };
      } catch (error) {
        console.error(`Error parsing JSON for court ${court.id}:`, error);
        return {
          ...court,
          coordinates: null,
          amenities: [],
          prices: [],
          tags: []
        };
      }
    });

    res.json(transformedCourts);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /courts/:slug - детали корта
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const court = await prisma.court.findUnique({
      where: { slug },
      include: {
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }

    // Transform JSON fields to proper types
    let transformedCourt;
    try {
      transformedCourt = {
        ...court,
        coordinates: court.coordinates ? JSON.parse(court.coordinates as string) : null,
        amenities: court.amenities ? JSON.parse(court.amenities as string) : [],
        prices: court.prices ? JSON.parse(court.prices as string) : [],
        tags: court.tags ? JSON.parse(court.tags as string) : []
      };
    } catch (error) {
      console.error(`Error parsing JSON for court ${court.id}:`, error);
      transformedCourt = {
        ...court,
        coordinates: null,
        amenities: [],
        prices: [],
        tags: []
      };
    }

    res.json(transformedCourt);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /courts/:courtId/reviews - отзывы для корта
router.get('/:courtId/reviews', async (req, res) => {
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

// POST /courts - создание корта
router.post('/', async (req, res) => {
  try {
    const courtData = req.body;

    // Преобразуем JSON поля в строки для Prisma
    const data: any = { ...courtData };
    if (data.coordinates) {
      data.coordinates = JSON.stringify(data.coordinates);
    }
    if (data.amenities) {
      data.amenities = JSON.stringify(data.amenities);
    }
    if (data.prices) {
      data.prices = JSON.stringify(data.prices);
    }
    if (data.tags) {
      data.tags = JSON.stringify(data.tags);
    }

    // Удаляем поле reviews - это relation, его нельзя создать напрямую
    delete data.reviews;

    const court = await prisma.court.create({
      data
    });

    // Transform JSON fields back to proper types for response
    const transformedCourt = {
      ...court,
      coordinates: court.coordinates ? JSON.parse(court.coordinates as string) : null,
      amenities: court.amenities ? JSON.parse(court.amenities as string) : [],
      prices: court.prices ? JSON.parse(court.prices as string) : [],
      tags: court.tags ? JSON.parse(court.tags as string) : []
    };

    res.status(201).json(transformedCourt);
  } catch (error) {
    console.error('Error creating court:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /courts/:id - обновление корта
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Преобразуем JSON поля в строки для Prisma
    const data: any = { ...updateData };
    if (data.coordinates) {
      data.coordinates = JSON.stringify(data.coordinates);
    }
    if (data.amenities) {
      data.amenities = JSON.stringify(data.amenities);
    }
    if (data.prices) {
      data.prices = JSON.stringify(data.prices);
    }
    if (data.tags) {
      data.tags = JSON.stringify(data.tags);
    }

    const court = await prisma.court.update({
      where: { id },
      data
    });

    // Transform JSON fields back to proper types for response
    const transformedCourt = {
      ...court,
      coordinates: court.coordinates ? JSON.parse(court.coordinates as string) : null,
      amenities: court.amenities ? JSON.parse(court.amenities as string) : [],
      prices: court.prices ? JSON.parse(court.prices as string) : [],
      tags: court.tags ? JSON.parse(court.tags as string) : []
    };

    res.json(transformedCourt);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /courts/:id - удаление корта
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.court.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export { router as courtsRouter };
