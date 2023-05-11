import { VFile } from "vfile";
import { Section } from "../types";

export class AWSUtils {
  static getVFileData(vfile: VFile): Section {
    return vfile.data as Section;
  }
}