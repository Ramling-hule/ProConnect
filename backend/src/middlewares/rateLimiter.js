import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 6000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many requests from this IP. Please try again after a minute.',
  },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
});

export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many registration requests from this IP. Please try again in an hour.',
  },
});
export const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const ua = req.headers['user-agent'] || '';
    return /Googlebot|bingbot|Slurp|DuckDuckBot|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp/i.test(ua);
  },
  message: {
    status: 429,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many requests to public API. Please slow down.',
  },
});

