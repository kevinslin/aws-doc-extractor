import path from "path";
import { CategoryAndNormalizedTitle, Link } from "../types/index.js";
import { VFile } from "vfile";
import { AWSUtils } from "./aws.js";
import _ from "lodash";


type CategoryMap = Record<string, string[]>;


// --- utils

interface KeyStringValueMap {
  [key: string]: string;
}

function createObjectFromKeyValues(keyValuePairs: [string[], string][]): KeyStringValueMap {
  const obj: KeyStringValueMap = {};

  keyValuePairs.forEach(([keys, value]) => {
    keys.forEach((key) => {
      obj[key] = value;
    });
  });

  return obj;
}

const pairs: [string[], string][] = [
  [["monitoring", "monitor"], "Monitor"],
  [["troubleshooting", "troubleshoot"], "Troubleshoot"],
  [["security", "access permissions"], "Security"],
  [["configure"], "Configure"],
  [["Integrating other services"], "Integration"],
  [["Overview"], "Overview"],
  [["API Reference"], "API"],
  // [[], ""],
];

const NORMALIZED_TITLE_MAPPING = createObjectFromKeyValues(pairs);

function normalizeTitle(title: string): string {
  const normalizedTitle = _.get(NORMALIZED_TITLE_MAPPING, title.toLowerCase(), false);
  if (normalizedTitle) {
    return normalizedTitle
  }
  if (/^Monitoring.*/.test(title) ) {
    return "Monitor"
  }
  if (/^Configuring.*/.test(title) ) {
    return "Configure"
  }
  if (/^Developing.*/.test(title) ) {
    return "Develop"
  }
  if (/^What is.*/.test(title) ) {
    return "Overview"
  }
  return title
}


// --- exports
export function matchCategory(opts: { link: string; category: CategoryMap }): string | false {
  const { link, category } = opts;
  for (const [k, v] of Object.entries(category)) {
    if (v.includes(link.toLowerCase())) {
      return k;
    }
  }
  return false;
}

export function getCategoryAndNormalizedTitleForLink(opts: { link: string; service: string }): CategoryAndNormalizedTitle {
  const normalizedTitle = normalizeTitle(opts.link)

  const Dev = ["getting started", "tutorials"];
  const commonCategories: CategoryMap = {
    Common: [
      "overview",
      "configure",
      "develop",
      "monitor",
      "troubleshoot",
      "integration",
      "resources and tags",
      "working with other services",
      "security",
      "networking",
      "api"
    ].concat(Dev),
  };
  const serviceCategories: Record<string, CategoryMap> = {
    ecs: {
      Common: ["developer tools overview", "account settings"],
    },
  };


  let category = matchCategory({ link: normalizedTitle, category: _.get(serviceCategories, opts.service.toLowerCase(), {}) });
  if (!category) {
    category = matchCategory({ link: normalizedTitle, category: commonCategories });
  }
  if (!category) {
    category = "Topics";
  }
  return {category, normalizedTitle: normalizedTitle }
}

export function getLinkMetadata(opts: { baseDir: string; vfile: VFile; service: string }): Link {
  const { baseDir, vfile, service } = opts;
  const url = path.join(vfile.basename!);
  const { title } = AWSUtils.getData(vfile)
  return {
    title,
    url,
    ...getCategoryAndNormalizedTitleForLink({ link: title, service }),
  };
}
