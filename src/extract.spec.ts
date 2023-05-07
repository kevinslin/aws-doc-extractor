import { extractFromAWSDocs } from './index'; // Update with the correct path to your function
import fs from 'fs';

describe('extractFromAWSDocs', () => {
    it('should extract entities according to the given conditions', () => {
        const testMarkdown = `# Section 1

Some content.

**Note**

This is a note.

This is a paragraph following the note.

# Section 2

**Note**

This is a paragraph following the second note:

This is a second paragraph after the colon.

This is not captured.
`;

        fs.writeFileSync('test.md', testMarkdown);

        const expectedEntities = [
            {
                position: {
                    start: { line: 7, column: 1, offset: 6 },
                    end: { line: 7, column: 1, offset: 6 },
                    indent: 0,
                },
                content: 'This is a note.',
                header: 'Section 1',
            },
            {
                position: {
                    start: { line: 15, column: 1, offset: 14 },
                    end: { line: 17, column: 1, offset: 16 },
                    indent: 0,
                },
                content:
                    'This is a paragraph following the second note:\n\nThis is a second paragraph after the colon.',
                header: 'Section 2',
            },
        ];

        const entities = extractFromAWSDocs('test.md');
        expect(entities).toMatchSnapshot()
        expect(entities).toEqual(expectedEntities);

        fs.unlinkSync('test.md');
    });
});
