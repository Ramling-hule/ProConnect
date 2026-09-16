import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestLogger, requestId } from './middlewares/requestLogger.js';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { RedisStore } from 'connect-redis';
import redisClient from './config/redis.js';
import { env } from './config/env.js';
import { registerRoutes } from './routes/index.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import paymentWebhookRoutes from './routes/paymentWebhookRoutes.js';

const app = express();
const allowedOrigins = [env.clientUrl, 'http://localhost:3001'];
const sessionStore = new RedisStore({ client: redisClient });
app.use('/api/payments/webhook', paymentWebhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "res.cloudinary.com"],
      connectSrc: ["'self'"]
    }
  },
  xFrameOptions: { action: 'deny' },
  referrerPolicy: { policy: 'same-origin' }
}));

app.use(requestId);
app.use(requestLogger);
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(apiLimiter);

app.use(session({
  store: sessionStore,
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: env.nodeEnv === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
  },
}));

app.get('/', (req, res) => {
  res.send('API is running...');
});
app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send([
    'User-agent: *',
    `Allow: /u/`,
    `Allow: /post/`,
    `Allow: /group/`,
    `Allow: /mentors/`,
    `Allow: /hackathons/`,
    `Disallow: /api/`,
    `Disallow: /feed`,
    `Disallow: /messages`,
    `Disallow: /settings`,
    `Disallow: /dashboard`,
    `Disallow: /notifications`,
    `Sitemap: ${env.clientUrl}/sitemap.xml`,
  ].join('\n'));
});

registerRoutes(app);

app.use(notFound);
app.use(errorHandler);

export default app;
