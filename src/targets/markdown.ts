import { VFile } from "vfile";
import { TargetMetadata, Section, Link } from "../types/index.js";
import { BaseTarget } from "./base.js";
import { AWSUtils } from "../utils/index.js";
import fs from "fs-extra";
import _debug from "debug";
import path from "path";
import _ from "lodash";
import matter from "gray-matter";
import { getLinkMetadata } from "../utils/links.js";
import { Categories } from "../constants/index.js";

const debug = _debug("MarkdownTarget")

class NoOpRender {
  render(text: string) {
    return text;
  }
}

const md = new NoOpRender();

function section2Markdown(section: Section): string {
  debug({ctx: "section2Markdown", section})
  const out = [];
  out.push(md.render('## ' + section.title + '\n'));
  out.push(md.render('- ' + section.notes.join('\n- ')));
  out.push(md.render('\n'));
  const content = out.join("\n");
  return content;
}

export class MarkdownSingleFileTarget extends BaseTarget {

  spec: { extension: string; } = {
    extension: "md"
  }

  async runAfterAllWriteHook(opts: { vfiles: VFile[], metadata: TargetMetadata }) {
    debug("runAfterAllWriteHook:enter")

    let currentParentSection = '';
    const out = [];
    for (const vfile of opts.vfiles) {
      const section = AWSUtils.getSections(vfile)[0];
      if (section.parent.title !== currentParentSection) {
        out.push(md.render('## ' + section.parent.title + '\n'));
        currentParentSection = section.parent.title;
      }
      out.push(vfile.value);
    }
    const content = out.join("\n");
    const basename = opts.metadata.title + '.' + this.spec.extension;
    const fpath = path.join(opts.metadata.destDir, basename);
    await fs.writeFile(fpath, content)
    return opts.vfiles;
  }

  renderFile(opts: { vfile: VFile, metadata: TargetMetadata }) {
    const section = AWSUtils.getSections(opts.vfile)[0];
    opts.vfile.value = section2Markdown(section);
    return opts.vfile
  }

  writeFile(opts: { vfile: VFile; metadata: TargetMetadata; }): VFile {
    return opts.vfile;
  }
}

export class MarkdownDendronFileTarget extends BaseTarget {
  spec: { extension: string; } = {
    extension: "md"
  }

  /**
   * Group files by parent title
   */
  async runBeforeAllWriteHook(opts: { vfiles: VFile[], metadata: TargetMetadata }) {
    await super.runBeforeAllWriteHook(opts);
    const groups = _.groupBy(opts.vfiles, (vfile) => {
      const section = AWSUtils.getSections(vfile)[0];
      return section.parent.title;
    });
    const simpleKebab = (astring: string) => {
      return astring.replace(/ /g, '-').toLowerCase();
    }

    const prefix = simpleKebab(opts.metadata.title);
    // reduce to one file per parent
    const vfiles = _.map(groups, (vfiles, parentTitle) => {
      const basename = [prefix, simpleKebab(parentTitle), this.spec.extension].join(".");
      const fpath = path.join(opts.metadata.destDir, basename);
      const vfile = new VFile({ path: fpath });
      const sections: Section[] = vfiles.flatMap(vfile => {
        return vfile.data.sections as Section[]
      })
      vfile.data = {
        sections,
        title: parentTitle
      }
      return vfile;
    });
    return vfiles;
  }

  async runAfterAllWriteHook(opts: { vfiles: VFile[]; metadata: TargetMetadata }) {
    const { vfiles, metadata } = opts;
    const { destDir, serviceName } = metadata;
    const linkMetaMap: { [key: string]: Link[] } = {};
    debug({ctx: "runAfterAllWriteHook:enter", vfiles: vfiles.length})

    vfiles.forEach((vfile) => {
        debug({ctx: "runAfterAllWriteHook", vfile: vfile.toString()})
        const linkMeta = getLinkMetadata({ baseDir: destDir, vfile, service: serviceName });
        if (!linkMetaMap[linkMeta.category]) {
            linkMetaMap[linkMeta.category] = [];
        }
        linkMetaMap[linkMeta.category].push(linkMeta);
    });

    const sc: string[] = [];
    const spacePaddingPerTab = 2;
    const basePadding = 0

    for (const category of Object.values(Categories)) {
        // header section
        sc.push(`${" ".repeat(spacePaddingPerTab * (basePadding + 1))}- ${category}`);

        linkMetaMap[category]?.forEach((link) => {
            const { url, title } = link;
            // TODO: should make this part of dendron-api instead
            const[first, rest] = url.split(".")
            const awsUrl = `./${first.toLowerCase()}/${rest}`
            const formattedLink = `[${title}](${awsUrl}.md)`;
            sc.push(`${" ".repeat(spacePaddingPerTab * (basePadding + 2))}- ${formattedLink}`);
        });
    }

    const content = sc.join("\n");
    const fpath = path.join(destDir, `SUMMARY.${serviceName}.md`);
    fs.writeFileSync(fpath, content);
    return vfiles;
  }



  renderFile(opts: { vfile: VFile, metadata: TargetMetadata }) {
    const sections = AWSUtils.getSections(opts.vfile);
    const title = opts.vfile.data.title;
    debug({ctx: "renderFile", title})

    // TODO: change to multiple sources
    const source = opts.metadata.sources[0];
    if (!source) {
      throw new Error("no source found")
    }
    const attribution = `This page was generated from content adapted from [${source.title}](${source.url})`
    const content = sections.map(section => section2Markdown(section)).join("\n");
    // TODO: dummy date
    const time = 1683841041000;
    opts.vfile.value = matter.stringify(
      // title
      ["# " + title, hint(attribution), content].join("\n"),
      {id: title, title, created: time, updated: time});
    return opts.vfile;
  }

  writeFile(opts: { vfile: VFile; metadata: TargetMetadata; }): VFile {
    const {vfile, metadata} = opts;
    const {title } = AWSUtils.getData(vfile)
    const destPath = path.join(metadata.destDir, vfile.basename!)
    debug({ctx: "writeFile", title, destPath});
    fs.writeFileSync(destPath, vfile.value);
    return vfile
  }
}

function hint(text: string) {
  return [`{% hint style="info" %}`, text, `{% endhint %}`].join("\n")
}