import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './services/database';

// Import routes
import salesRoutes from './routes/sales';
import productsRoutes from './routes/products';
import customersRoutes from './routes/customers';
import customizationsRoutes from './routes/customizations';
import dashboardRoutes from './routes/dashboard';
import intelligenceRoutes from './routes/intelligence';
import chatbotRoutes from './routes/chatbot';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// CORS configuration - supports both development and production
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (corsOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Favicon endpoint (to prevent 404 errors)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Health check endpoint
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

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('[ERROR] Database connection failed. Please check your database configuration.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`[OK] Server running on http://localhost:${PORT}`);
      console.log(`[OK] API endpoints available at http://localhost:${PORT}/api`);
      console.log(`[OK] Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('[ERROR] Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

