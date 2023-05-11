import { VFile } from "vfile";
import { TargetMetadata, Section } from "../types/index.js";
import { BaseTarget } from "./base.js";
import { AWSUtils } from "../utils/index.js";
import fs from "fs-extra";
import _debug from "debug";
import path from "path";

const debug = _debug("MarkdownTarget")

class NoOpRender {
  render(text: string) {
    return text;
  }
}

const md = new NoOpRender();

export class MarkdownTarget extends BaseTarget {

  spec: { extension: string; } = {
    extension: "md"
  }

  async runAfterAllWriteHook(opts: { vfiles: VFile[], metadata: TargetMetadata }) {
    debug("runAfterAllWriteHook:enter")

    const out = [];
    for (const vfile of opts.vfiles) {
      out.push(vfile.value);
    }
    const content = out.join("\n");
    const basename = opts.metadata.title + '.' + this.spec.extension;
    const fpath = path.join(opts.metadata.destDir, basename);
    await fs.writeFile(fpath, content)
    return opts.vfiles;
  }

  renderFile(opts: { vfile: VFile, metadata: TargetMetadata }) {
    const out = [];
    out.push(md.render('# ' + opts.metadata.title));
    let currentParentSection = '';
    const section = AWSUtils.getVFileData(opts.vfile);

    if (section.parent.title !== currentParentSection) {
      out.push(md.render('## ' + section.parent.title + '\n'));
      currentParentSection = section.parent.title;
    }

    out.push(md.render('### ' + section.title + '\n'));
    out.push(md.render('- ' + section.notes.join('\n- ')));
    out.push(md.render('\n'));
    const content = out.join("\n");
    opts.vfile.value = content;
    return opts.vfile
  }

  writeFile(opts: { vfile: VFile; metadata: TargetMetadata; }): VFile {
    return opts.vfile;
  }
}

// export class MarkdownDendronTarget extends BaseTarget {
//   spec: { extension: string; } = {
//     extension: "md"
//   }

//   renderFile(opts: { sections: Section[], metadata: TargetMetadata }) {
//     const out:  = [];
//     out.push(md.render('# ' + opts.metadata.title));
//   }
// }