import express from 'express';
import { processChatbotQuery } from '../services/chatbot';

const router = express.Router();

// POST /api/chatbot/query
router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Query is required and must be a string'
      });
    }

    const result = await processChatbotQuery(query);
    res.json(result);
  } catch (error: any) {
    console.error('Error in chatbot query endpoint:', error);
    res.status(500).json({
      error: 'Failed to process query',
      message: error.message || 'Unknown error'
    });
  }
});

export default router;

