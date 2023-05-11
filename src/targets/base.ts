import path from "path";
import { Metadata, Section } from "../types";
import fs from "fs-extra"

export type TargetSpec = {
  extension: string
}

export interface Target {
  spec: TargetSpec
  render(opts: { sections: Section[], metadata: Metadata }): string
}

export abstract class BaseTarget {
  abstract spec: TargetSpec;

  abstract render(opts: { sections: Section[], metadata: Metadata }): string

  write(opts: { destDir: string } & { sections: Section[], metadata: Metadata }) {
    const fname = opts.metadata.title + '.' + this.spec.extension;
    fs.ensureDirSync(opts.destDir);
    return fs.writeFile(
      path.join(opts.destDir, fname), this.render(opts));
  }
}