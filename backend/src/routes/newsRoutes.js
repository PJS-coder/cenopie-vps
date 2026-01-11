import express from 'express';
import News from '../models/News.js';
import Company from '../models/Company.js';

const router = express.Router();

// Get all published news from all companies (for feed)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const news = await News.find({ 
      isPublished: true 
    })
    .populate('companyId', 'name logo isVerified')
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await News.countDocuments({ isPublished: true });

    res.json({
      news: news.map(article => ({
        id: article._id,
        title: article.title,
        content: article.content,
        image: article.image,
        publishedAt: article.publishedAt,
        company: {
          id: article.companyId._id,
          name: article.companyId.name,
          logo: article.companyId.logo,
          isVerified: article.companyId.isVerified
        },
        timeAgo: getTimeAgo(article.publishedAt)
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Get single news article by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const article = await News.findOne({ 
      _id: id,
      isPublished: true 
    }).populate('companyId', 'name logo isVerified');

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({
      news: {
        id: article._id,
        title: article.title,
        content: article.content,
        image: article.image,
        publishedAt: article.publishedAt,
        company: {
          id: article.companyId._id,
          name: article.companyId.name,
          logo: article.companyId.logo,
          isVerified: article.companyId.isVerified
        },
        timeAgo: getTimeAgo(article.publishedAt)
      }
    });
  } catch (error) {
    console.error('Error fetching news article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffTime = Math.abs(now - new Date(date));
  const diffMinutes = Math.ceil(diffTime / (1000 * 60));
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return new Date(date).toLocaleDateString();
  }
}

export default router;