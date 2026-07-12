import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { isPathInside, isSafeRegularFile } from "../lib/memory-path-safety";

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "vitamap-memory-root-"));
  const outside = await fs.mkdtemp(path.join(os.tmpdir(), "vitamap-memory-outside-"));
  const safe = path.join(root, "safe.md");
  const secret = path.join(outside, "secret.md");
  const link = path.join(root, "linked.md");
  await fs.writeFile(safe, "safe", "utf8");
  await fs.writeFile(secret, "secret", "utf8");
  await fs.symlink(secret, link);

  assert.equal(isPathInside(safe, root), true);
  assert.equal(isPathInside(secret, root), false);
  assert.equal(await isSafeRegularFile(root, safe), true);
  assert.equal(await isSafeRegularFile(root, link), false);

  await fs.rm(root, { recursive: true, force: true });
  await fs.rm(outside, { recursive: true, force: true });
  console.log("Memory path safety: todas las pruebas pasaron.");
}

void main();
