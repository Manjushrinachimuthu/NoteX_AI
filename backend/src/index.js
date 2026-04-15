const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const meetingRoutes = require('./routes/meetings');
const noteRoutes = require('./routes/notes');
const { setupSocketHandlers } = require('./services/socketService');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/notes', noteRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NoteX AI Backend is running' });
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});