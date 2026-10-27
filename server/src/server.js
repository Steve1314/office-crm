require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { startTaskReminderService } = require('./services/taskReminderService');
const { attachLiveClient } = require('./services/liveUpdateService');

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Office CRM API Server',
    database: 'MongoDB',
    pushService: 'Firebase Cloud Messaging (FCM)',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/events', attachLiveClient);

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));

const path = require('path');
const fs = require('fs');

// Direct APK Download Endpoint
app.get(['/download/apk', '/api/download/apk'], (req, res) => {
  const apkPath = path.resolve(__dirname, '../public/OfficeCRM.apk');
  if (fs.existsSync(apkPath)) {
    return res.download(apkPath, 'OfficeCRM.apk');
  }
  res.status(404).json({ success: false, message: 'APK not found on server' });
});

// Static client build serving (production SPA fallback)
const clientDistPath = path.resolve(__dirname, '../public');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 Handler
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

app.use((req, res) => {
  const indexHtml = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  res.status(404).json({ success: false, message: 'Resource Not Found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// Process Level Crash Handlers
process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception caught (process guarded):', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection caught (process guarded):', reason);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Office CRM Server running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  startTaskReminderService();
});
