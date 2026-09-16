import { encryptMessage, decryptMessage } from '../src/utils/crypto.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env relative to this test file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const runTests = () => {
  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  };

  try {
    const originalText = "Hello, secret world! 🌍";
    
    // Test 1: Basic Encryption & Decryption
    const encrypted = encryptMessage(originalText);
    assert(encrypted.encryptedMessage !== originalText, 'Ciphertext is not plaintext');
    assert(encrypted.iv.length === 24, 'IV is 12 bytes (24 hex chars)');
    assert(encrypted.authTag.length === 32, 'AuthTag is 16 bytes (32 hex chars)');
    
    const decrypted = decryptMessage(encrypted.encryptedMessage, encrypted.iv, encrypted.authTag, encrypted.keyVersion);
    assert(decrypted === originalText, 'Decrypted text matches original');

    // Test 2: Uniqueness of IVs
    const encrypted2 = encryptMessage(originalText);
    assert(encrypted.iv !== encrypted2.iv, 'IVs are unique per message');
    assert(encrypted.encryptedMessage !== encrypted2.encryptedMessage, 'Ciphertexts are different for same plaintext due to random IV');

    // Test 3: Tampered Auth Tag
    const tamperedAuthTag = encrypted.authTag.substring(0, 31) + (encrypted.authTag[31] === '0' ? '1' : '0');
    try {
      decryptMessage(encrypted.encryptedMessage, encrypted.iv, tamperedAuthTag, encrypted.keyVersion);
      assert(false, 'Should throw error when auth tag is tampered');
    } catch (e) {
      assert(true, 'Throws error when auth tag is tampered');
    }

    // Test 4: Tampered Ciphertext
    const tamperedCipher = encrypted.encryptedMessage.substring(0, 5) + '0' + encrypted.encryptedMessage.substring(6);
    try {
      decryptMessage(tamperedCipher, encrypted.iv, encrypted.authTag, encrypted.keyVersion);
      assert(false, 'Should throw error when ciphertext is tampered');
    } catch (e) {
      assert(true, 'Throws error when ciphertext is tampered');
    }

  } catch (error) {
    console.error("Test execution failed:", error);
    failed++;
  }

  console.log(`\n--- Test Summary ---`);
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  if (failed > 0) process.exit(1);
};

runTests();
