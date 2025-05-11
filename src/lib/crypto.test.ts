import { encrypt, decrypt } from './crypto';

// Mock env.ts to use a consistent CRYPTO_SECRET_KEY for tests
jest.mock('@/env', () => ({
  env: {
    CRYPTO_SECRET_KEY: 'mocked-secret-key',
  },
}));

describe('Crypto Functions', () => {
  it('should correctly encrypt and decrypt text', () => {
    const originalText = 'Hello, World!';
    const encryptedText = encrypt(originalText);
    const decryptedText = decrypt(encryptedText);

    expect(decryptedText).toBe(originalText);
  });

  it('should handle empty strings correctly', () => {
    expect(() => decrypt('')).toThrow('Invalid encrypted data format: data is empty');
  });

  it('should throw an error for invalid encrypted data format', () => {
    expect(() => decrypt('invalid-encrypted-data')).toThrow('Invalid encrypted data format: missing colon (":") separator');
  });

  it('should throw an error for corrupted encrypted data', () => {
    const originalText = 'Hello, World!';
    const encryptedText = encrypt(originalText);

    // Corrupt the encrypted text by modifying one of its parts
    const corruptedEncryptedText = `invalid:${encryptedText.split(':')[1]}:${encryptedText.split(':')[2]}:${encryptedText.split(':')[3]}`;

    expect(() => decrypt(corruptedEncryptedText)).toThrow(
      'Decryption failed: invalid authentication tag (data may be tampered)'
    );
  });
});
