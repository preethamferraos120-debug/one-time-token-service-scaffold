// test.js
// Prove the service is single-use under concurrency.
//
// TODO:
//   1. Issue one token.
//   2. Fire 5 consumeToken calls AT ONCE with Promise.all.
//   3. Count how many returned { ok: true } and assert it is exactly 1.
//   4. Print the winners count so it shows in the output.

import { issueToken, consumeToken, closeRedis } from "./token-service.js";

async function main() {
  const id = await issueToken({ userId: 42 }, 60);
  console.log("issued token:", id);

  const results = await Promise.all([
    consumeToken(id),
    consumeToken(id),
    consumeToken(id),
    consumeToken(id),
    consumeToken(id),
  ]);

  const winners = results.filter((r) => r.ok).length;
  console.log("winners:", winners); // expect exactly 1

  console.assert(winners === 1, "SINGLE-USE VIOLATED! winners = " + winners);
  if (winners === 1) console.log("PASS: token was single-use.");

  if (winners !== 1) {
    process.exitCode = 1;
  }
  await closeRedis();
}

main();
