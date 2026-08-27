const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const env = require('./config/env');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { initChatSocket } = require('./sockets/chatSocket');
const collaboratorRoutes = require('./routes/collaboratorRoutes');
const { setIo } = require('./controllers/collaboratorController');
const { errorHandler } = require('./middleware/errorHandler');


connectDB();

const app = express();
app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', collaboratorRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/chats', chatRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: env.CLIENT_URL }
});

initChatSocket(io);
setIo(io);

app.use(errorHandler);

server.listen(env.PORT, () => console.log(`Server running on port ${env.PORT}`));