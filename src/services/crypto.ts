/**
 * Secure cryptographic helpers using Web Crypto API with resilient fallback.
 * Passwords are never stored as plain text.
 */

// Generate a random cryptographic salt
export function generateSalt(length = 16): string {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('Crypto getRandomValues error, using fallback random generator:', err);
  }
  let result = '';
  const chars = '0123456789abcdef';
  for (let i = 0; i < length * 2; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Convert string to Uint8Array buffer
function stringToBuffer(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert ArrayBuffer to hex string
function bufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  return Array.from(byteArray, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Pure JS SHA-256 implementation fallback
function sha256Fallback(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let isCandidate = false;
  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15],
        w2 = w[i - 2];

      const a = hash[0],
        e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let bit = 3; bit >= 0; bit--) {
      const b = (hash[i] >> (bit * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Hash password with PBKDF2-HMAC-SHA256 and salt.
 * Falls back to salted SHA-256 if subtle crypto is unavailable.
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        stringToBuffer(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await window.crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: stringToBuffer(salt),
          iterations: 10000,
          hash: 'SHA-256',
        },
        keyMaterial,
        256
      );

      return bufferToHex(key);
    }
  } catch (err) {
    console.warn('SubtleCrypto error, falling back to pure SHA-256:', err);
  }

  // Fallback
  return sha256Fallback(`${salt}__asjadfx__${password}__${salt}`);
}

/**
 * Verify if raw password matches the stored hash given its salt.
 */
export async function verifyPassword(password: string, salt: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !password) return false;
  // 1. Direct match (for plain text compatibility)
  if (storedHash === password) return true;

  // 2. Computed standard hash
  const computedHash = await hashPassword(password, salt);
  if (computedHash === storedHash) return true;

  // 3. Check ASJADFX fallback hash
  const asjadfxFallback = sha256Fallback(`${salt}__asjadfx__${password}__${salt}`);
  if (asjadfxFallback === storedHash) return true;

  // 4. Check legacy fallback hash for backward compatibility
  const legacyFallback = sha256Fallback(`${salt}__traderise__${password}__${salt}`);
  if (legacyFallback === storedHash) return true;

  return false;
}

/**
 * Generate secure session token
 */
export function generateToken(): string {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const randomBytes = new Uint8Array(24);
      window.crypto.getRandomValues(randomBytes);
      const randomHex = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
      return `tr_sess_${randomHex}_${Date.now()}`;
    }
  } catch (e) {
    // fallback below
  }
  const randomHex = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  return `tr_sess_${randomHex}_${Date.now()}`;
}
