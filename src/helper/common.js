import archiver from "archiver";
import fs from "fs";
import path from "path";

export function zipImages(fileName, outputDir) {
  const zipPath = path.join(process.cwd(), `output/${fileName}.zip`);
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve(zipPath));
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.directory(outputDir, false);
    archive.finalize();
  });
}
