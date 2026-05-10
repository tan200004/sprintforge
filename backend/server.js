require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

const connectDatabase = require('./config/db');
const { verifyAccessToken } = require('./utils/tokenHelper');
const SprintforgeUser = require('./models/User');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const activityRoutes = require('./routes/activityRoutes');
const aiRoutes = require('./routes/aiRoutes');

const myExpressApp = express();
const myHttpServer = http.createServer(myExpressApp);

const myWebSocket = new SocketIOServer(myHttpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
  pingTimeout: 60000,
});

myWebSocket.use(async (theSocket, nextStep) => {
  try {
    const passedToken = theSocket.handshake.auth?.token;
    if (!passedToken) return nextStep(new Error('Need a token'));
    const tokenInfo = verifyAccessToken(passedToken);
    const foundUser = await SprintforgeUser.findById(tokenInfo.uid).select('fullName role');
    if (!foundUser) return nextStep(new Error('User missing'));
    theSocket.forgeUser = foundUser;
    nextStep();
  } catch (err) {
    nextStep(new Error('Token is bad'));
  }
});

myWebSocket.on('connection', (theSocket) => {
  const onlinePerson = theSocket.forgeUser;
  console.log(`🔌 Someone connected: ${onlinePerson.fullName} (${theSocket.id})`);

  theSocket.join(`user:${onlinePerson._id}`);

  theSocket.on('forge:join:project', (projId) => {
    theSocket.join(`project:${projId}`);
    console.log(`📌 ${onlinePerson.fullName} is looking at project: ${projId}`);
  });

  theSocket.on('forge:leave:project', (projId) => {
    theSocket.leave(`project:${projId}`);
  });

  SprintforgeUser.findByIdAndUpdate(onlinePerson._id, { isOnline: true, lastActiveAt: new Date() }).exec();

  theSocket.on('disconnect', () => {
    SprintforgeUser.findByIdAndUpdate(onlinePerson._id, { isOnline: false, lastActiveAt: new Date() }).exec();
    console.log(`🔌 Disconnected: ${onlinePerson.fullName}`);
  });
});

myExpressApp.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

myExpressApp.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

myExpressApp.use(express.json({ limit: '5mb' }));
myExpressApp.use(express.urlencoded({ extended: true, limit: '5mb' }));
myExpressApp.use(cookieParser());
myExpressApp.use(mongoSanitize());

if (process.env.NODE_ENV === 'development') {
  myExpressApp.use(morgan('dev'));
}

const myRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, slow down.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login tries. Wait a bit.' },
});

myExpressApp.use('/api', myRateLimiter);
myExpressApp.use('/api/auth/login', loginLimiter);
myExpressApp.use('/api/auth/register', loginLimiter);

myExpressApp.use('/uploads', express.static(path.join(__dirname, 'uploads')));

myExpressApp.use((req, res, nextStep) => {
  req.io = myWebSocket;
  nextStep();
});

myExpressApp.use('/api/auth', authRoutes);
myExpressApp.use('/api/projects', projectRoutes);
myExpressApp.use('/api/tasks', taskRoutes);
myExpressApp.use('/api/comments', commentRoutes);
myExpressApp.use('/api/notifications', notificationRoutes);
myExpressApp.use('/api/users', userRoutes);
myExpressApp.use('/api/dashboard', dashboardRoutes);
myExpressApp.use('/api/activity', activityRoutes);
myExpressApp.use('/api/ai', aiRoutes);

myExpressApp.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    service: 'My API',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

myExpressApp.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  myExpressApp.use(express.static(frontendPath));
  myExpressApp.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

myExpressApp.use((err, req, res, nextStep) => {
  console.error('❌ Error happened:', err);
  const theCode = err.statusCode || 500;
  const theMessage =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  res.status(theCode).json({ success: false, message: theMessage });
});

const portNumber = process.env.PORT || 5000;

const startMyServer = async () => {
  await connectDatabase();
  myHttpServer.listen(portNumber, '0.0.0.0', () => {
    console.log(`\n🚀 Server is up on port ${portNumber}`);
    console.log(`   Env : ${process.env.NODE_ENV}`);
    console.log(`   URL : ${process.env.CLIENT_URL}`);
  });
};

startMyServer();
