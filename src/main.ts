
import fs from "fs-extra";
import { glob } from 'glob';
import path from 'path';
import { extractFromAWSDocs } from ".";
import { readJson, writeJson, pathExists } from "fs-extra";

type Content = ContentInner & {
  contents: ContentInner[];
};
type ContentInner = {
  title: string;
  href: string;
  notes?: string[];
};

type Entities = {
  map: any;
  content: string;
};

// === Utils

function replaceEnd(str: string, search: string, replace: string) {
  const index = str.lastIndexOf(search);
  if (index === -1) return str;
  return str.slice(0, index) + replace;
}

// ===

async function processMarkdownFiles(inputDir: string, outputDir: string) {
  // Read all files in the input directory
  const files = await glob(`**/*.md`, { cwd: inputDir });
  // Process each markdown file in the input directory
  files.forEach((file) => {
    if (path.extname(file) === '.md') {
      const inputFile = path.join(inputDir, file);
      const outputFile = path.join(outputDir, file);
      fs.ensureDirSync(outputDir);

      // Extract entities from the markdown file
      const entities = extractFromAWSDocs(inputFile);
      if (entities.length === 0) {
        return
      }

      fs.ensureFileSync(outputFile);
      console.log(`Entities extracted from ${inputFile}: ${entities.length}`)
      // Write the entities to a new file in the output directory
      fs.writeFile(outputFile, JSON.stringify(entities, null, 2), (err) => {
        if (err) {
          console.error(`Error writing file ${outputFile}: ${err}`);
          return;
        }

        console.log(`File written: ${outputFile}`);
      });
    }
  });
}

async function combineTocAndNotes(contents: Content[], dataDir: string) {
  for (const c of contents) {
      const fname = c.href.replace(".html", ".md");
      const fpath = path.join(dataDir, fname);
      if (await pathExists(fpath)) {
          const out: Entities[] = await readJson(fpath);
          c.notes = out.map(e => e.content);
      }
      if (c.contents) {
          await combineTocAndNotes(c.contents, dataDir);
      }
  }
}

// ===
async function main() {
  // const inputDir = "/Users/kevinlin/code/proj.aws-docs/semantic-search-aws-docs/amazon-ecs-developer-guide"
  // const outputDir = "/Users/kevinlin/code/proj.aws-docs/aws-doc-extractor/build"
  // processMarkdownFiles(inputDir, outputDir);
  console.log("start")

  const base = "/Users/kevinlin/code/proj.aws-docs/aws-doc-extractor"

  const fpath = path.join(base, "data/ecs-toc.json");
  const dataDir = path.join(base, "build/doc_source")
  const toc: { contents: Content[] } = await readJson(fpath);
  await combineTocAndNotes(toc.contents, dataDir);
  await writeJson(replaceEnd(fpath, ".json", "out.json"), toc);
}


main()