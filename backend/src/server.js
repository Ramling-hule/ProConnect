import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import app from './app.js';
import { env } from './config/env.js';
import { registerSocketHandlers } from './socket/index.js';
import logger from './utils/logger.js';
import { startCron as startPaymentReconciliation } from './cron/paymentReconciliation.js';

connectDB();
startPaymentReconciliation();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);
registerSocketHandlers(io);

const PORT = env.port || 5002;
server.listen(PORT, () => logger.info(`Server running on port ${PORT}`, { port: PORT, env: env.nodeEnv }));
server.on('error', (err) => {
  if (err?.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Exiting.`, {
      port: PORT,
      hint: `Run: netstat -ano | findstr :${PORT}  →  taskkill /PID <PID> /F`,
    });
  } else {
    logger.error('Server startup error', { err: err.message, stack: err.stack });
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION — shutting down', {
    message: err.message,
    stack: err.stack,
    type: 'uncaughtException',
  });
  setTimeout(() => process.exit(1), 500);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED PROMISE REJECTION — shutting down', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    type: 'unhandledRejection',
  });
  setTimeout(() => process.exit(1), 500);
});
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — closing HTTP server gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
