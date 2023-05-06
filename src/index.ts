import MarkdownIt from 'markdown-it';
import fs from 'fs';

interface Entity {
  // title of the document
  title: string
  // path to the document
  fpath: string
  type: string
  position?: Position
}

interface Position {
  start: Point
  end: Point
  indent: number // [number >= 1]?
}

interface Point {
  line: number // number >= 1
  column: number // number >= 1
  offset: number // number >= 0?
}

function main() {
}

export function selectFromMarkdown(sql: string): Entity[] {
  const regex = /^select\s+(.*?)\s+from\s+"(.*?)"/i;
  const match = regex.exec(sql);

  if (!match) {
    throw new Error('Invalid SQL');
  }

  const selection = match[1].toLowerCase();
  const filePath = match[2];

  const content = fs.readFileSync(filePath, 'utf-8');
  const md = new MarkdownIt();
  const tokens = md.parse(content, {});

  const entities: Entity[] = [];

  tokens.forEach((token, index) => {
    if (token.type === 'heading_open') {
      if (selection === 'header') {
        const title = tokens[index + 1].content;
        const position: Position = {
          start: { line: token.map[0] + 1, column: 1, offset: token.map[0] },
          end: { line: token.map[1] + 1, column: 1, offset: token.map[1] },
          indent: token.markup.length >= 1 ? token.markup.length : undefined,
        };

        const entity: Entity = {
          title,
          fpath: filePath,
          type: 'header',
          position,
        };

        entities.push(entity);
      }
    } else if (token.type === 'em_open') {
      if (selection === 'emphasized') {
        const title = tokens[index + 1].content;
        const position: Position = {
          start: { line: token.map[0] + 1, column: 1, offset: token.map[0] },
          end: { line: token.map[1] + 1, column: 1, offset: token.map[1] },
          indent: token.markup.length >= 1 ? token.markup.length : undefined,
        };

        const entity: Entity = {
          title,
          fpath: filePath,
          type: 'emphasized',
          position,
        };

        entities.push(entity);
      }
    }
  });

  return entities
}
