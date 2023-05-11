import MarkdownIt from "markdown-it";
import { TargetMetadata, Section } from "../types/index.js";
import { BaseTarget, Target } from "./base.js";

const md = new MarkdownIt();

export class HTMLTarget extends BaseTarget {
  spec = {
    extension: "html"
  };

  renderFile(opts: {sections: Section[], metadata: TargetMetadata}) { 
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