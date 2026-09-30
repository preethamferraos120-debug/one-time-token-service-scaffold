// token-service.js
// A single-use, expiring token service backed by Redis.
//
// You implement the two functions below. The lesson walks through the exact
// pattern — this file is just the shape to fill in.

import crypto from "node:crypto";
import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);

// Helper: build the Redis key for a token id.
const keyFor = (id) => "token:" + id;

/**
 * Issue a single-use token that expires after `ttlSeconds`.
 *
 * TODO:
 *   1. Generate a random id: crypto.randomBytes(16).toString("hex")  -> 32 hex chars
 *   2. JSON.stringify the payload.
 *   3. Store it under keyFor(id) with a TTL, in ONE atomic command:
 *        await redis.set(keyFor(id), value, "EX", ttlSeconds, "NX");
 *   4. Return the token id string.
 *
 * @param {object} payload      Any JSON-serialisable data (e.g. { userId: 42 }).
 * @param {number} ttlSeconds   Seconds until the token expires.
 * @returns {Promise<string>}   The token id to hand to the user.
 */
export async function issueToken(payload, ttlSeconds) {
  const tokenId = crypto.randomBytes(16).toString("hex");
  const value = JSON.stringify(payload);
  await redis.set(keyFor(tokenId), value, "EX", ttlSeconds, "NX");
  return tokenId;
}

/**
 * Consume a token exactly once.
 *
 * TODO:
 *   1. Read AND delete the token in ONE atomic command:
 *        const value = await redis.getdel(keyFor(tokenId));
 *   2. If value is null -> return { ok: false, reason: "invalid" }.
 *   3. Otherwise -> return { ok: true, payload: JSON.parse(value) }.
 *
 * Do NOT use GET then DEL as two separate commands — that races.
 *
 * @param {string} tokenId
 * @returns {Promise<{ ok: true, payload: object } | { ok: false, reason: string }>}
 */
export async function consumeToken(tokenId) {
  const value = await redis.getdel(keyFor(tokenId));
  if (value === null) {
    return { ok: false, reason: "invalid" };
  }
  return { ok: true, payload: JSON.parse(value) };
}

// Allow other files to close the connection cleanly (used by test.js).
export function closeRedis() {
  return redis.quit();
}
