/**
 * Chiffrement AES-256-GCM pour les tokens et clés API stockés en DB
 *
 * Utilise l'API Web Crypto (disponible nativement dans Node.js 20+)
 * Format de stockage : base64(iv):base64(ciphertext):base64(authTag)
 */

// Clé de chiffrement depuis les variables d'env (32 bytes en base64)
function getEncryptionKey(): string {
  const key = process.env["ENCRYPTION_KEY"];
  if (!key) {
    throw new Error("ENCRYPTION_KEY manquante dans les variables d'environnement");
  }
  return key;
}

/**
 * Dérive une CryptoKey depuis la clé base64 en variable d'env
 */
async function deriveCryptoKey(rawKey: string): Promise<CryptoKey> {
  const keyBuffer = Buffer.from(rawKey, "base64");
  return crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Chiffre une valeur en AES-256-GCM
 * Retourne une chaîne au format : base64(iv):base64(ciphertext)
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await deriveCryptoKey(getEncryptionKey());
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits IV pour GCM

  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  const ivBase64 = Buffer.from(iv).toString("base64");
  const ciphertextBase64 = Buffer.from(ciphertext).toString("base64");

  return `${ivBase64}:${ciphertextBase64}`;
}

/**
 * Déchiffre une valeur chiffrée en AES-256-GCM
 */
export async function decrypt(encryptedValue: string): Promise<string> {
  const [ivBase64, ciphertextBase64] = encryptedValue.split(":");

  if (!ivBase64 || !ciphertextBase64) {
    throw new Error("Format de valeur chiffrée invalide");
  }

  const key = await deriveCryptoKey(getEncryptionKey());
  const iv = Buffer.from(ivBase64, "base64");
  const ciphertext = Buffer.from(ciphertextBase64, "base64");

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Chiffre une valeur si elle n'est pas vide, retourne null sinon
 */
export async function encryptOptional(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  return encrypt(value);
}

/**
 * Déchiffre une valeur si elle n'est pas null
 */
export async function decryptOptional(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  return decrypt(value);
}
