
// --- AWS Content
/**
 * contents:
 *   - title:         # ContentTopLevel
 *     href:
 *     contents:      
 *        - title:    # ContentInner
 *          href:
 *          contents:  
 */

export type Content = ContentInner & {
  contents: ContentTopLevel[];
};
export type ContentTopLevel = {
  title: string;
  href: string;
  contents?: ContentInner[]
}
export type ContentInner = {
  title: string;
  href: string;
  notes?: string[];
  contents?: ContentInner[]
};

export type Entities = {
  map: any;
  content: string;
};

export type Section ={
  title: string;
  href: string;
  notes: string[];
  parent: ContentInner;
};


// --- Extractor Formats
export enum TargetFormat {
  "html.single-page" = "html.single-page",
  "md.single-page" = "md.single-page",
  "md.multi-page.dendron" = "md.multi-page.dendron"
}

export type TargetMetadata = {
  /**
   * @deprecated: replace with serviceName
   */
  title: string;

  destDir: string
  serviceName: string
  sources: ContentSource[]
}

// --- Content on Page
export type Link = {
  title: string;
  url: string;
  category: string;
};

// --- Unsorted

export type ContentSource = {
  title: string
  url: string
}