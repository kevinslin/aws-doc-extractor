import fs from 'fs';
import MarkdownIt from 'markdown-it';

describe.skip('proto', () => {

  it("extract", () => {
    const content = fs.readFileSync("data/sample_doc.md", 'utf-8');
    const md = new MarkdownIt();
    const tokens = md.parse(content, {});
    expect(tokens).toMatchSnapshot()
  });

});
