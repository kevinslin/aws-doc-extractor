import { VFile } from "vfile";
import { TargetMetadata, Section } from "../types";
import { BaseTarget } from "./base";
import { AWSUtils } from "../utils";
import fs from "fs-extra";

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
    const out = [];
    for (const vfile of opts.vfiles) {
      out.push(vfile.value);
    }
    const content = out.join("\n");
    const fname = opts.metadata.title + '.' + this.spec.extension;
    await fs.writeFile(fname, content)
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