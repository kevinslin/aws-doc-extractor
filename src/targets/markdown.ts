import { Metadata, Section } from "../types";
import { BaseTarget } from "./base";

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

  render(opts: {sections: Section[], metadata: Metadata}) { 
    const out = [];
    out.push(md.render('# ' + opts.metadata.title));
    let currentParentSection = '';
    for (const section of opts.sections) {
      if (section.parent.title !== currentParentSection) {
        out.push(md.render('## ' + section.parent.title + '\n'));
        currentParentSection = section.parent.title;
      }
  
      out.push(md.render('### ' + section.title + '\n'));
      out.push(md.render('- ' + section.notes.join('\n- ')));
      out.push(md.render('\n'));
    }
    return out.join("\n");
  }
}