import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { isInternalPath, sessionCookieName, shouldAllowRequest } from "./route-protection";

const scrypt = promisify(scryptCallback);

const HASH_PREFIX = "scrypt";
const HASH_KEY_LENGTH = 64;
const TOKEN_VERSION = "v1";

export { isInternalPath, sessionCookieName, shouldAllowRequest };

function toBase64Url(value: Buffer | string): string {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function fromBase64Url(value: string): Buffer {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  return Buffer.from(normalized, "base64");
}

function signPayload(payload: string, secret: string): string {
  return toBase64Url(createHmac("sha256", secret).update(payload).digest());
}

export async function getPasswordHash(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, HASH_KEY_LENGTH)) as Buffer;

  return `${HASH_PREFIX}:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [prefix, salt, hash] = storedHash.split(":");

  if (prefix !== HASH_PREFIX || !salt || !hash) {
    return false;
  }

  const storedKey = Buffer.from(hash, "hex");
  const derivedKey = (await scrypt(password, salt, storedKey.length)) as Buffer;

  if (storedKey.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedKey, derivedKey);
}

export async function createSessionToken(
  userId: string,
  secret: string
): Promise<string> {
  const payload = toBase64Url(
    JSON.stringify({
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      v: TOKEN_VERSION
    })
  );
  const signature = signPayload(payload, secret);

  return `${payload}.${signature}`;
}

export async function getSessionUserId(
  token: string,
  secret: string
): Promise<string | null> {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(payload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payload).toString("utf8")) as {
      sub?: unknown;
      v?: unknown;
    };

    if (parsed.v !== TOKEN_VERSION || typeof parsed.sub !== "string") {
      return null;
    }

    return parsed.sub;
  } catch {
    return null;
  }
}
