import fs from "fs-extra";
import MarkdownIt from 'markdown-it';

interface Entity {
  position?: Position;
  map: [number, number]
  content: string;
  header: string;
}

interface Position {
  start: Point;
  end: Point;
  indent: number;
}

interface Point {
  line: number;
  column: number;
  offset?: number;
}


export function extractFromAWSDocs(fpath: string): Entity[] {
  const md = new MarkdownIt();
  const fileContent = fs.readFileSync(fpath, 'utf8');
  const tokens = md.parse(fileContent, {});
  const entities: Entity[] = [];

  let currentHeader = '';

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    debugger;

    if (token.type === 'heading_open') {
      currentHeader = tokens[i + 1].content;
    } else if (
      token.type === 'inline' &&
      token.children &&
      token.children.length >= 4 &&
      token.children[0].type === 'text' &&
      token.children[1].type === 'strong_open' &&
      token.children[2].type === 'text' &&
      token.children[2].content === 'Note' &&
      token.children[3].type === 'strong_close'
    ) {

      const contentToken = tokens[i];
      if (!contentToken || !contentToken.map) {
        continue
      }
      // const position: Position = {
      //   start: {
      //     line: contentToken.map[0],
      //     column: 0,
      //     // offset: contentToken.pos,
      //   },
      //   end: {
      //     line: contentToken.map[1],
      //     column: 0,
      //     // offset: contentToken.pos + contentToken.content.length,
      //   },
      //   indent: token.level,
      // };

      let content = contentToken.content.trim();

      // if (content.endsWith(':') && tokens[i + 4].type === 'paragraph_open') {
      //   const t = tokens[i + 5];
      //   if (!t || !t.map) {
      //     continue
      //   }
      //   content += '\n\n' + tokens[i + 5].content.trim();
      //   position.end = {
      //     line: t.map[1],
      //     column: 0,
      //     // offset: tokens[i + 5].pos + tokens[i + 5].content.length,
      //   };
      //   i += 4;
      // } else {
      //   i += 2;
      // }

      entities.push({
        map: contentToken.map,
        content,
        header: currentHeader,
      });
    }
  }

  return entities;
}