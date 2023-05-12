// Import the necessary dependencies and functions
import { VFile } from 'vfile';
import { matchCategory, getCategoryForLink, getLinkMetadata } from './links.js';

describe('matchCategory', () => {
  const category = {
    category1: ['link1', 'link2'],
    category2: ['link3', 'link4'],
  };

  it('should return the category if the link is found', () => {
    const result = matchCategory({ link: 'link2', category });
    expect(result).toEqual('category1');
  });

  it('should return false if the link is not found', () => {
    const result = matchCategory({ link: 'link5', category });
    expect(result).toBe(false);
  });
});

describe('getCategoryForLink', () => {
  // TODO: support category overrides
  const commonCategories = {
    Dev: ['Getting started', 'Tutorials'],
    Common: ['Resources and tags', 'Monitoring', 'Working with other services', 'Troubleshooting'],
  };
  const serviceCategories = {
    ecs: {
      Dev: ['Developer tools overview', 'Account settings'],
    },
  };

  it('should return the category from serviceCategories if it exists', () => {
    const result = getCategoryForLink({ link: 'Developer tools overview', service: 'ecs' });
    expect(result).toEqual('Dev');
  });

  it('should return the category from commonCategories if no category found in serviceCategories', () => {
    const result = getCategoryForLink({ link: 'Tutorials', service: 'nonexistent' });
    expect(result).toEqual('Dev');
  });

  it('should return "Topics" if no category found in both serviceCategories and commonCategories', () => {
    const result = getCategoryForLink({ link: 'link1', service: 'nonexistent2' });
    expect(result).toEqual('Topics');
  });
});

// TODO: this test is not validated
describe('getLinkMetadata', () => {
  const baseDir = '/path/to/base';
  const vfile = new VFile({ basename: 'file.md' })
  const service = 'ecs';

  it('should return the link metadata with the correct category', () => {
    const linkMetadata = getLinkMetadata({ baseDir, vfile, service });
    expect(linkMetadata).toEqual({
      title: expect.anything(),
      url: expect.anything(),
      category: 'Dev',
    });
  });
});
