import MarkdownIt from 'markdown-it';
import path from 'path';
import fs from "fs-extra";

interface Entity {
  position: Position;
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
  offset: number;
}

export function extractFromAWSDocs(fpath: string): Entity[] {
  const markdownContent = fs.readFileSync(fpath, 'utf-8');
  const md = new MarkdownIt();
  const tokens = md.parse(markdownContent, {});
  const entities: Entity[] = [];
  let currentHeader = '';
  let captureNext = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'heading_open') {
      currentHeader = tokens[i + 1].content;
    } else if (token.type === 'paragraph_open' && tokens[i + 1].content === '**Note**') {
      captureNext = true;
    } else if (captureNext && token.type === 'paragraph_open' && token.map) {
      const startPosition: Point = {
        line: token.map[0] + 1,
        column: 1,
        offset: token.map[0],
      };

      const endPosition: Point = {
        line: token.map[1],
        column: 1,
        offset: token.map[1] - 1,
      };

      const position: Position = {
        start: startPosition,
        end: endPosition,
        indent: token.level,
      };

      const content = tokens[i + 1].content;
      const entity: Entity = {
        position,
        content,
        header: currentHeader,
      };

      if (content.endsWith(':')) {
        const nextToken = tokens[i + 4];
        if (nextToken.type === 'paragraph_open') {
          entity.content += '\n\n' + tokens[i + 5].content;
          i += 2;
        }
      }

      entities.push(entity);
      captureNext = false;
    }
  }

  return entities;
}

function main() {
  const inputDir = "/Users/kevinlin/code/proj.aws-docs/semantic-search-aws-docs/amazon-ecs-developer-guide"
  const outputDir = "/Users/kevinlin/code/proj.aws-docs/aws-doc-extractor/build"
  processMarkdownFiles(inputDir, outputDir);
}

function processMarkdownFiles(inputDir: string, outputDir: string) {
  // Read all files in the input directory
  fs.readdir(inputDir, (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${err}`);
      return;
    }

    // Process each markdown file in the input directory
    files.forEach((file) => {
      if (path.extname(file) === '.md') {
        const inputFile = path.join(inputDir, file);
        const outputFile = path.join(outputDir, file);
        fs.ensureDirSync(outputDir);

        // Extract entities from the markdown file
        const entities = extractFromAWSDocs(inputFile);
        if (!entities) {
          return
        }

        console.log(`Entities extracted from ${inputFile}: ${entities.length}`)
        // Write the entities to a new file in the output directory
        fs.writeFile(outputFile, JSON.stringify(entities, null, 2), (err) => {
          if (err) {
            console.error(`Error writing file ${outputFile}: ${err}`);
            return;
          }

          console.log(`File written: ${outputFile}`);
        });
      }
    });
  });
}

main()