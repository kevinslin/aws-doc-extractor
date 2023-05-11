import fs from "fs-extra";
import { VFile } from "vfile";
import { Section, TargetMetadata } from "../types";

export type TargetSpec = {
  extension: string
}

export interface Target {
  spec: TargetSpec
  render(opts: { sections: Section[], metadata: TargetMetadata }): string
}

export type RenderOutput = {
  vfiles: VFile[]
}

export abstract class BaseTarget {
  abstract spec: TargetSpec;

  abstract renderFile(opts: { vfile: VFile, metadata: TargetMetadata }): VFile

  abstract writeFile(opts: { vfile: VFile, metadata: TargetMetadata }): VFile


  async runBeforeAllWriteHook(opts: { vfiles: VFile[], metadata: TargetMetadata }) {
    fs.ensureDirSync(opts.metadata.destDir);
  }
  async runAfterAllWriteHook(opts: { vfiles: VFile[], metadata: TargetMetadata }) {
    return opts.vfiles;
  }

  async write(opts: { vfiles: VFile[], metadata: TargetMetadata }) {
    const fname = opts.metadata.title + '.' + this.spec.extension;
    const metadata = opts.metadata

    await this.runBeforeAllWriteHook(opts);

    // render all files
    let vfilesIntermediate = await Promise.all(opts.vfiles.map(vfile => {
      return this.renderFile({ vfile, metadata })
    }))
    vfilesIntermediate = await Promise.all(
      vfilesIntermediate.map(vfile => {
        return this.writeFile({ vfile, metadata })
      }))

    vfilesIntermediate = await this.runAfterAllWriteHook({ vfiles: opts.vfiles, metadata })
    return vfilesIntermediate;
  }
}


