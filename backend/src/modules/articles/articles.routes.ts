import express from 'express';
import { prisma } from '../../config/database';
import { cacheMiddleware, invalidateCache } from '../../middleware/cache';

const router = express.Router();

// GET /articles - список статей с фильтрами
router.get('/', async (req, res) => {
  try {
    const { category, limit = '10' } = req.query;

    const where: any = { published: true };
    if (category) {
      where.category = category;
    }

    const articles = await prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /articles/:slug - детальная статья
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const article = await prisma.article.findUnique({
      where: { slug, published: true },
    });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    res.json(article);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /articles - создание статьи (для админки)
router.post('/', async (req, res) => {
  try {
    const articleData = req.body;

    const article = await prisma.article.create({
      data: articleData
    });

    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /articles/:id - обновление статьи
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const articleData = req.body;

    const article = await prisma.article.update({
      where: { id },
      data: articleData
    });

    res.json(article);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE /articles/:id - удаление статьи
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.article.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export { router as articlesRouter };