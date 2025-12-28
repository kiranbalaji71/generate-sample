import archiver from "archiver";
import fs from "fs";
import path from "path";

/**
 * Zips all files in a directory and returns the path to the ZIP file.
 * @param fileName Name of the ZIP file (without extension)
 * @param outputDir Path to the directory containing files to zip
 * @returns Promise resolving to the absolute path of the created ZIP file
 */
export function zipImages(
  fileName: string,
  outputDir: string
): Promise<string> {
  const zipPath = path.join(process.cwd(), `output/${fileName}.zip`);
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve(zipPath));
    archive.on("error", (err: Error) => reject(err));

    archive.pipe(output);
    archive.directory(outputDir, false);
    archive.finalize();
  });
}
