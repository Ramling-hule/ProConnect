import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().transform(Number).default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRE: z.string().default('7d'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  REDIS_URL: z.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default('dummy_webhook_secret'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required in production').or(z.literal('')),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  CHROMA_API_URL: z.string().min(1, 'CHROMA_API_URL is required'),
  CHROMA_API_KEY: z.string().optional().default(''),
  CHROMA_COLLECTION_NAME: z.string().default('educational_resources'),
  PINECONE_API_KEY: z.string().optional().default(''),
  PINECONE_INDEX_NAME: z.string().optional().default(''),
  SESSION_SECRET: z.string().default('your_secret_key'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  SMTP_HOST: z.string().default('smtp-relay.brevo.com'),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default(''),
  BASE_URL: z.string().optional().default(''),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
});

let parsedEnv;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Invalid environment variables:', error.format());
  process.exit(1);
}
export const env = {
  port: parsedEnv.PORT,
  nodeEnv: parsedEnv.NODE_ENV,
  jwtSecret: parsedEnv.JWT_SECRET,
  jwtExpire: parsedEnv.JWT_EXPIRE,
  mongoUri: parsedEnv.MONGO_URI,
  redisUrl: parsedEnv.REDIS_URL,
  razorpayWebhookSecret: parsedEnv.RAZORPAY_WEBHOOK_SECRET,
  clientUrl: parsedEnv.CLIENT_URL,
  openaiApiKey: parsedEnv.OPENAI_API_KEY,
  openaiModel: parsedEnv.OPENAI_MODEL,
  geminiApiKey: parsedEnv.GEMINI_API_KEY,
  geminiModel: parsedEnv.GEMINI_MODEL,
  openaiEmbeddingModel: parsedEnv.OPENAI_EMBEDDING_MODEL,
  chromaApiUrl: parsedEnv.CHROMA_API_URL,
  chromaApiKey: parsedEnv.CHROMA_API_KEY,
  chromaCollectionName: parsedEnv.CHROMA_COLLECTION_NAME,
  pineconeApiKey: parsedEnv.PINECONE_API_KEY,
  pineconeIndexName: parsedEnv.PINECONE_INDEX_NAME,
  sessionSecret: parsedEnv.SESSION_SECRET,
  cloudinaryCloudName: parsedEnv.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: parsedEnv.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: parsedEnv.CLOUDINARY_API_SECRET,
  smtpHost: parsedEnv.SMTP_HOST,
  smtpPort: parsedEnv.SMTP_PORT,
  smtpUser: parsedEnv.SMTP_USER,
  smtpPass: parsedEnv.SMTP_PASS,
  emailFrom: parsedEnv.EMAIL_FROM,
  baseUrl: parsedEnv.BASE_URL,
  googleClientId: parsedEnv.GOOGLE_CLIENT_ID,
};
