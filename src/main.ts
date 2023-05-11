
import fs from "fs-extra";
import { glob } from 'glob';
import path from 'path';
import { extractFromAWSDocs } from "./index.js";
import _ from "lodash";
import { ContentInner, Entities, ContentTopLevel, Content, TargetFormat, Section } from "./types/index.js";
import { HTMLTarget } from "./targets/index.js";
import { MarkdownTarget } from "./targets/markdown.js";
import { VFile } from "vfile";

// === Init

// === Utils

function replaceEnd(str: string, search: string, replace: string) {
  const index = str.lastIndexOf(search);
  if (index === -1) return str;
  return str.slice(0, index) + replace;
}

// === Functions

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

async function combineTocAndNotes(contents: ContentInner[], dataDir: string) {
  for (const c of contents) {
      const fname = c.href.replace(".html", ".md");
      const fpath = path.join(dataDir, fname);
      if (await fs.pathExists(fpath)) {
          const out: Entities[] = await fs.readJson(fpath);
          c.notes = out.map(e => e.content);
      }
      if (c.contents) {
          await combineTocAndNotes(c.contents, dataDir);
      }
  }
}

function filterSectionWithContent(data: ContentTopLevel[]): Section[] {
  const sections: Section[] = [];

  for (const parentContent of data) {
    if (!parentContent.contents) {
      continue
    }
    for (const sectionContent of parentContent.contents) {
      if (sectionContent.notes) {
        const { title, href, notes } = sectionContent;
        const parent = _.omit(parentContent, 'contents');
        const out = {
          title,
          href,
          notes,
          parent,
        };
        sections.push(out);
      }
    }
  }

  return sections;
}


function section2VFiles(sections: Section[]): VFile[] {
  return sections.map(s => {
    return new VFile({data: s})
  })
}


function renderFromJSON(opts: {data: ContentTopLevel[], serviceName: string, renderTargetFormat: TargetFormat, destDir: string}) {
  const sections = filterSectionWithContent(opts.data);
  const vfiles: VFile[] = section2VFiles(sections);
  const metadata = {title: opts.serviceName, destDir: opts.destDir};
  switch (opts.renderTargetFormat) {
    case TargetFormat["md.single-page"]:
      return new MarkdownTarget().write({vfiles, metadata});
    case TargetFormat["html.single-page"]:
      return new HTMLTarget().write({vfiles, metadata});
    // case TargetFormat["md.multi-page"]:
    //   return new MarkdownMultiPageTarget().write({sections, metadata: {title: opts.serviceName}, destDir: opts.destDir});
    default:
      throw new Error(`Unsupported render target format: ${opts.renderTargetFormat}`)
  }
}


// ===
async function main() {
  const inputDir = "/Users/kevinlin/code/proj.aws-docs/semantic-search-aws-docs/amazon-ecs-developer-guide"
  const buildDir = "/Users/kevinlin/code/proj.aws-docs/aws-doc-extractor/build"
  const artifactDir = path.join(buildDir, "artifacts");

  console.log("pre:parsing aws docs")
  processMarkdownFiles(inputDir, buildDir);


  console.log("pre:combining toc and notes")
  const base = "/Users/kevinlin/code/proj.aws-docs/aws-doc-extractor"
  const fpath = path.join(base, "data/ecs-toc.json");
  const dataDir = path.join(base, "build/doc_source")
  const toc: Content = await fs.readJson(fpath);
  await combineTocAndNotes(toc.contents, dataDir);
  await fs.writeJson(replaceEnd(fpath, ".json", "out.json"), toc);

  // const tocEnriched = fs.fs.readJsonSync('/Users/kevinlin/code/proj.aws-docs/aws-doc-extractor/data/ecs-tocout.json');
  console.log("pre:render")
  const serviceName = "ECS"
  const renderTargetFormat = TargetFormat["md.single-page"]
  // const renderTargetFormat = TargetFormat["html.single-page"]
  const artifactDirPath = path.join(artifactDir, serviceName, renderTargetFormat)

  const out = await renderFromJSON(
    {
      data: toc.contents,
      renderTargetFormat,
      serviceName,
      destDir: artifactDirPath
    });
  console.log("done")
}


main()