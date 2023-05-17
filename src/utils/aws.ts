import _ from "lodash";
import { VFile } from "vfile";
import { ServiceNames } from "../constants/aws.js";
import { Section, ServiceMetadata } from "../types/index.js";
import fetch from "node-fetch"

import _debug from "debug";
import path from "path";
const debug = _debug("AWSUtils")

export class AWSUtils {
  static getSections(vfile: VFile): Section[] {
    return vfile.data.sections as Section[]
  }

  static async getDocTocForService(service: ServiceMetadata) {
    const resp = await fetch(service.toc_url);
    const content = await resp.json();
    return content;
  }

  static getDocRepoForService(service: ServiceMetadata) {


    const awsgitrepo = (service: ServiceMetadata): string => {
      return `https://github.com/awsdocs/${service.git_repo}`;
    }
    return awsgitrepo(service);
  }

  static getDocPathForService(service: ServiceMetadata) {
    return path.join('docs', service.norm_name, 'developer-guide');
  }

  static getDocTocPathForService(service: ServiceMetadata) {
    return path.join('docs', service.norm_name, 'toc.json');
  }

  static getArtifactPath() {
    return path.join("build", "artifacts")
  }

  static getArtifactPathForService(service: ServiceMetadata, renderTargetFormat: string) {
    return path.join(this.getArtifactPath(), service.norm_name, renderTargetFormat)
  }

  static getStagingPathForService(service: ServiceMetadata) {
    return path.join('build', "staging", service.norm_name);
  }

  static getData(vfile: VFile): {
    sections: Section[],
    title: string
  } {
    return vfile.data as {
      sections: Section[],
      title: string
    }
  }
}

export class AWSConstants {

  /**
 * Normalize service name
 */
  static normalizeServiceName = (
    name: string,
    opts?: { snakeCase?: boolean; stripPrefix?: boolean }
  ): string => {
    const blacklist = ["S_3", "EC_2", "IO_T", "V_2", "F_S", "AP_I"];
    opts = _.defaults(opts, {
      snakeCase: true,
      stripPrefix: false
    });
    let normName = name;

    if (opts.stripPrefix) {
      normName = _.trim(normName.replace(/^(AWS|AMAZON)/i, ""));
      // TODO
    }

    if (opts.snakeCase) {
      let modKey = _.snakeCase(name).toUpperCase();
      blacklist.forEach(ent => {
        if (modKey.indexOf(ent) >= 0) {
          modKey = modKey.replace(ent, ent.replace("_", ""));
        }
      });
      normName = modKey;
    }

    return normName;
  }


}