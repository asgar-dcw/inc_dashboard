// Vercel serverless function wrapper for Express app
// This allows us to use the existing Express backend with minimal changes

import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import { testConnection } from '../backend/src/services/database';

// Import routes
import salesRoutes from '../backend/src/routes/sales';
import productsRoutes from '../backend/src/routes/products';
import customersRoutes from '../backend/src/routes/customers';
import customizationsRoutes from '../backend/src/routes/customizations';
import dashboardRoutes from '../backend/src/routes/dashboard';
import intelligenceRoutes from '../backend/src/routes/intelligence';
import chatbotRoutes from '../backend/src/routes/chatbot';

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins in serverless (you can restrict this)
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/sales', salesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/customizations', customizationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Convert Vercel request/response to Express-compatible format
  return new Promise((resolve) => {
    // @ts-ignore - Vercel types may not match exactly
    app(req, res, () => {
      resolve(undefined);
    });
  });
}

