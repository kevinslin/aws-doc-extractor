
import fs from "fs-extra";
import { glob } from 'glob';
import path from 'path';
import { extractFromAWSDocs } from "../index.js";
import _ from "lodash";
import { ContentInner, Entities, ContentTopLevel, Content, TargetFormat, Section, ContentSource, ServiceMetadata } from "../types/index.js";
import { HTMLTarget } from "../targets/index.js";
import { MarkdownDendronFileTarget, MarkdownSingleFileTarget } from "../targets/markdown.js";
import { VFile } from "vfile";
import _debug from "debug";
import { AWSUtils } from "../utils/aws.js";
const log = _debug("extractNotesFromService")
const debug = _debug("extractNotesFromService:debug")

// === Init

// === Utils

function replaceEnd(str: string, search: string, replace: string) {
  const index = str.lastIndexOf(search);
  if (index === -1) return str;
  return str.slice(0, index) + replace;
}

// === Functions

/**
 * Extract notable entities from all markdown files in the input directory
 * @param inputDir 
 * @param outputDir 
 */
async function processMarkdownFiles(inputDir: string, outputDir: string) {
  // Read all files in the input directory
  const files = await glob(`**/*.md`, { cwd: inputDir });
  // Process each markdown file in the input directory
  files.forEach((file) => {
    if (path.extname(file) === '.md') {
      const inputFile = path.join(inputDir, file);
      const outputFile = path.join(outputDir, path.basename(file));
      fs.ensureDirSync(outputDir);

      // Extract entities from the markdown file
      const entities = extractFromAWSDocs(inputFile);
      if (entities.length === 0) {
        return
      }

      fs.ensureFileSync(outputFile);
      log({ ctx: "processMarkdownFiles", inputFile, entities: entities.length})
      // Write the entities to a new file in the output directory
      fs.writeFile(outputFile, JSON.stringify(entities, null, 2), (err) => {
        if (err) {
          console.error(`Error writing file ${outputFile}: ${err}`);
          return;
        }
        log({ ctx: "processMarkdownFiles", outputFile });
      });
    }
  });
}

/**
 * Map the notes from the markdown files to the TOC
 * @param contents 
 * @param dataDir 
 */
async function combineTocAndNotes(contents: ContentInner[], dataDir: string) {
  for (const c of contents) {
    const fname = c.href.replace(".html", ".md");
    const fpath = path.join(dataDir, fname);
    debug({ctx: "combineTocAndNotes", fname, fpath})
    if (await fs.pathExists(fpath)) {
      debug({ctx: "combineTocAndNotes", msg: `found ${fpath}`})
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
    return new VFile({ data: { sections: [s] } })
  })
}


function renderFromJSON(opts: { data: ContentTopLevel[], serviceName: string, renderTargetFormat: TargetFormat, destDir: string, sources: ContentSource[] }) {
  const sections = filterSectionWithContent(opts.data);
  const vfiles: VFile[] = section2VFiles(sections);
  log({ctx: "renderFromJSON", sections: sections.length, vfiles: vfiles.length})
  const metadata = {
    title: opts.serviceName,
    destDir: opts.destDir, 
    serviceName: opts.serviceName,
    sources: opts.sources
  };
  log({ctx: "renderFromJSON", metadata});
  switch (opts.renderTargetFormat) {
    case TargetFormat["md.single-page"]:
      return new MarkdownSingleFileTarget().write({ vfiles, metadata });
    case TargetFormat["md.multi-page.dendron"]:
      return new MarkdownDendronFileTarget().write({ vfiles, metadata });
    case TargetFormat["html.single-page"]:
      return new HTMLTarget().write({ vfiles, metadata });
    default:
      throw new Error(`Unsupported render target format: ${opts.renderTargetFormat}`)
  }
}



// ===


export async function extractNotesFromService(opts: { basedir: string, service: ServiceMetadata, sources: ContentSource[] }) {
  const inputDir = path.join(opts.basedir, AWSUtils.getDocPathForService(opts.service));
  const stagingDir = path.join(opts.basedir, AWSUtils.getStagingPathForService(opts.service));
  const artifactDir = AWSUtils.getArtifactPath()
  const tocPath = path.join(opts.basedir, AWSUtils.getDocTocPathForService(opts.service));

  const ctx = "downloadDocs";
  log({ ctx, inputDir, buildDir: stagingDir, artifactDir, msg: "enter" })

  log({ ctx, msg: "pre:parsing aws docs" })
  processMarkdownFiles(inputDir, stagingDir);


  log("pre:combining toc and notes")
  const toc: Content = await fs.readJson(tocPath);
  await combineTocAndNotes(toc.contents, stagingDir);
  // TODO: remove this
  await fs.writeJson(replaceEnd(tocPath, ".json", "out.json"), toc);

  log("pre:render")
  const renderTargetFormat = TargetFormat["md.multi-page.dendron"]
  const artifactDirForServiceAndTargetFormat = path.join(opts.basedir, AWSUtils.getArtifactPathForService(opts.service, renderTargetFormat));
  await renderFromJSON(
    {
      data: toc.contents,
      renderTargetFormat,
      serviceName: opts.service.norm_name,
      destDir: artifactDirForServiceAndTargetFormat,
      sources: opts.sources
    });

  console.log("done")

}
