import MarkdownIt from "markdown-it";
import { Metadata, Section } from "../types";
import { BaseTarget, Target } from "./base";

const md = new MarkdownIt();

export class HTMLTarget extends BaseTarget {
  spec = {
    extension: "html"
  };

  render(opts: {sections: Section[], metadata: Metadata}) { 
    const out = [];
    out.push(md.render('# ' + opts.metadata.title));
    let currentParentSection = '';
    for (const section of opts.sections) {
      if (section.parent.title !== currentParentSection) {
        out.push(md.render('## ' + section.parent.title));
        currentParentSection = section.parent.title;
      }
  
      out.push(md.render('### ' + section.title));
      out.push(md.render('- ' + section.notes.join('\n- ')));
    }
    return out.join("\n");
  }
}