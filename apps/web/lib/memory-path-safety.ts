import fs from "node:fs/promises";
import path from "node:path";

export function isPathInside(child: string, parent: string): boolean {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return !!rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}

/** Bloquea symlinks y exige que el fichero real permanezca dentro del root. */
export async function isSafeRegularFile(root: string, candidate: string): Promise<boolean> {
  try {
    const stat = await fs.lstat(candidate);
    if (!stat.isFile() || stat.isSymbolicLink()) return false;
    const [real, realRoot] = await Promise.all([
      fs.realpath(candidate),
      fs.realpath(root),
    ]);
    return isPathInside(real, realRoot);
  } catch {
    return false;
  }
}
