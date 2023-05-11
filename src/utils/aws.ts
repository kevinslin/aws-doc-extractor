import { VFile } from "vfile";
import { Section } from "../types/index.js";

export class AWSUtils {
  static getVFileData(vfile: VFile): Section {
    return vfile.data as Section;
  }
}