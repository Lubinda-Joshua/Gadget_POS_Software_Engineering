/** Local image storage for the single-server course deployment. */

import path from "path";
import { mkdir, writeFile } from "fs/promises";

export interface UploadResult {
  url: string;
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  _contentType: string
): Promise<UploadResult> {
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), buffer);
  return { url: `/uploads/${filename}` };
}
