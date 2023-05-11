import { VFile } from "vfile";
import { Section } from "../types/index.js";

export class AWSUtils {
  static getSections(vfile: VFile): Section[] {
    return vfile.data.sections as Section[]
  }

  static getData(vfile: VFile): {
    sections: Section[],
    title: string
  } {
    return vfile.data as {
      sections: Section[],
      title: string
    }
  }
}