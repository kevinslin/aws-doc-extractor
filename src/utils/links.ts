import path from "path";
import { Link } from "../types/index.js";
import { VFile } from "vfile";
import { AWSUtils } from "./aws.js";
import _ from "lodash";


type CategoryMap = Record<string, string[]>;


export function matchCategory(opts: { link: string; category: CategoryMap }): string | false {
  const { link, category } = opts;
  for (const [k, v] of Object.entries(category)) {
      if (v.includes(link)) {
          return k;
      }
  }
  return false;
}

export function getCategoryForLink(opts: { link: string; service: string }) {
  const commonCategories: CategoryMap = {
      Dev: ["getting started", "tutorials"],
      Common: ["resources and tags", "monitoring", "working with other services", "troubleshooting"],
  };
  const serviceCategories: Record<string,CategoryMap> = {
      ecs: {
          Dev: ["developer tools overview", "account settings"],
      },
  };

  const link = opts.link.toLowerCase();

  let category = matchCategory({ link, category: _.get(serviceCategories, opts.service.toLowerCase(), {}) });
  if (!category) {
      category = matchCategory({ link, category: commonCategories });
  }
  if (!category) {
      category = "Topics";
  }
  return category;
}

export function getLinkMetadata(opts: { baseDir: string; vfile: VFile; service: string }): Link {
  const { baseDir, vfile, service } = opts;
  const url = path.join(vfile.basename!);
  const {title} = AWSUtils.getData(vfile)
  return {
      title,
      url,
      category: getCategoryForLink({ link: title, service }),
  };
}
