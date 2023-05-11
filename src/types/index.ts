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


export enum TargetFormat {
  "html.single-page" = "html.single-page",
  "md.single-page" = "md.single-page",
}

export type Metadata = {
  title: string;
}
