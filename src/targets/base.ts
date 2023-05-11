import fs from "fs-extra";
import { VFile } from "vfile";
import { Section, TargetMetadata } from "../types/index.js";

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
    return opts.vfiles;
  }
  async runAfterAllWriteHook(opts: { vfiles: VFile[], metadata: TargetMetadata }) {
    return opts.vfiles;
  }

  async write(opts: { vfiles: VFile[], metadata: TargetMetadata }) {
    const metadata = opts.metadata

    let vfilesIntermediate = await this.runBeforeAllWriteHook(opts);

    // render all files
    vfilesIntermediate = await Promise.all(vfilesIntermediate.map(vfile => {
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


