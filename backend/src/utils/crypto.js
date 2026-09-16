import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const getActiveKey = () => {
  const version = 1;
  const hexKey = process.env[`MESSAGE_ENCRYPTION_KEY_V${version}`];
  
  if (!hexKey) {
    throw new Error(`Encryption key MESSAGE_ENCRYPTION_KEY_V${version} is missing.`);
  }

  const keyBuffer = Buffer.from(hexKey, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be exactly 32 bytes (64 hex characters) for AES-256.');
  }

  return { version, keyBuffer };
};
const getKeyByVersion = (version) => {
  const hexKey = process.env[`MESSAGE_ENCRYPTION_KEY_V${version}`];
  
  if (!hexKey) {
    throw new Error(`Encryption key for version ${version} is missing.`);
  }

  const keyBuffer = Buffer.from(hexKey, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be exactly 32 bytes (64 hex characters) for AES-256.');
  }

  return keyBuffer;
};
export const encryptMessage = (plainText) => {
  if (!plainText) return null;

  try {
    const { version, keyBuffer } = getActiveKey();
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
    
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      encryptedMessage: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      keyVersion: version
    };
  } catch (error) {
    console.error('Encryption Error:', error);
    throw new Error('Failed to encrypt message');
  }
};
export const decryptMessage = (encryptedMessage, iv, authTag, keyVersion = 1) => {
  if (!encryptedMessage || !iv || !authTag) return null;

  try {
    const keyBuffer = getKeyByVersion(keyVersion);
    const ivBuffer = Buffer.from(iv, 'hex');
    const authTagBuffer = Buffer.from(authTag, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    let decrypted = decipher.update(encryptedMessage, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption Error:', error);
    throw new Error('Failed to decrypt message. It may have been tampered with or corrupted.');
  }
};
