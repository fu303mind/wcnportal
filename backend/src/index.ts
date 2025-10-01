import 'express-async-errors';
import http from 'http';
import path from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
// import csrf from 'csurf';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import xssClean from 'xss-clean';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { Server } from 'socket.io';
import { StatusCodes } from 'http-status-codes';
import env from '@/config/env';
import logger from '@/config/logger';
import { connectDatabase } from '@/config/database';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import { requestLogger } from '@/middleware/requestLogger';
import authRoutes from '@/routes/authRoutes';
import userRoutes from '@/routes/userRoutes';
import workflowRoutes from '@/routes/workflowRoutes';
import documentRoutes from '@/routes/documentRoutes';
import notificationRoutes from '@/routes/notificationRoutes';
import clientRoutes from '@/routes/clientRoutes';
import searchRoutes from '@/routes/searchRoutes';
import dashboardRoutes from '@/routes/dashboardRoutes';
import { registerNotificationSocket } from '@/services/notificationService';
import { verifyAccessToken } from '@/utils/generateTokens';

const app = express();
const server = http.createServer(app);

const allowedOrigins = env.FRONTEND_URL.split(',').map((origin) => origin.trim());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

registerNotificationSocket(io);

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    const payload = verifyAccessToken(token);
    socket.join(payload.sub);
    return next();
  } catch (error) {
    return next(error as Error);
  }
});

io.on('connection', (socket) => {
  logger.info('Socket connected', { id: socket.id });
  socket.on('disconnect', () => {
    logger.info('Socket disconnected', { id: socket.id });
  });
});

// const csrfProtection = csrf({ cookie: { httpOnly: true, sameSite: 'lax', secure: env.NODE_ENV === 'production' } });

app.set('trust proxy', 1);

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false
}));

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(requestLogger);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());
app.use(xssClean());

const swaggerPath = path.resolve(__dirname, './docs/openapi.yaml');
if (env.ENABLE_SWAGGER) {
  const swaggerDocument = YAML.load(swaggerPath);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.get('/api/health', (_req, res) => {
  res.status(StatusCodes.OK).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV
  });
});

// app.use(csrfProtection);

// app.get('/api/csrf-token', (req, res) => {
//   const token = req.csrfToken();
//   res.cookie('XSRF-TOKEN', token, {
//     sameSite: 'lax',
//     secure: env.NODE_ENV === 'production'
//   });
//   res.status(StatusCodes.OK).json({ csrfToken: token });
// });

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  try {
    await connectDatabase();
    server.listen(env.PORT, () => {
      logger.info('Server started', { port: env.PORT, env: env.NODE_ENV });
    });
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
};

if (env.NODE_ENV !== 'test') {
  void start();
}

export { app, server, io, start };
export default app;
