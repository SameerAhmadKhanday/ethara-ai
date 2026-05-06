const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'], credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Routes
const apiRouter = express.Router();
apiRouter.use('/auth', require('./routes/auth'));
apiRouter.use('/projects', require('./routes/projects'));
apiRouter.use('/tasks', require('./routes/tasks'));
apiRouter.use('/dashboard', require('./routes/dashboard'));

app.use('/api', apiRouter);
app.use('/', apiRouter); // Fallback for Vercel if it strips the /api prefix

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Ethara PM API is running 🚀' }));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`));
}

// Export for Vercel
module.exports = app;
