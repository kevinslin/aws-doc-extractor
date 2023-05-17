import _ from "lodash";
import { VFile } from "vfile";
import { ServiceNames } from "../constants/aws.js";
import { Section } from "../types/index.js";

import _debug from "debug";
import path from "path";
const debug = _debug("AWSUtils")

export class AWSUtils {
  static getSections(vfile: VFile): Section[] {
    return vfile.data.sections as Section[]
  }

  static async getDocTocForService(service: string) {
    const serviceNameNoSpaces = _.get(ServiceNames, service).replace(' ', '');
    const getDocTypeURLForService = (service: string) => {
      const wholeUrlOverrides = {
        AMAZON_EC2: "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/toc-contents.json",
        AWS_LAMBDA: "https://docs.aws.amazon.com/lambda/latest/dg/toc-contents.json",
        AMAZON_SIMPLE_STORAGE_SERVICE: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/toc-contents.json",
      }
      if (service in wholeUrlOverrides) {
        // @ts-ignore
        return wholeUrlOverrides[service]
      }
    }
    const url = getDocTypeURLForService(service) || `https://docs.aws.amazon.com/${serviceNameNoSpaces}/latest/userguide/toc-contents.json`
    debug({ ctx: "getDocTocForService", url })
    const resp = await fetch(url);
    const content = await resp.json();
    return content;
  }

  static getDocRepoForService(service: string) {
    const getDocTypeForService = (service: string) => {
      const overrides = {
        AMAZON_EC2: "user-guide",
        AMAZON_SIMPLE_STORAGE_SERVICE: "userguide",
      }
      if (service in overrides) {
        // @ts-ignore
        return overrides[service]
      }
      return "developer-guide"
    }

    const getServiceRepo = (service: string) => {
      const overrides = {
        AMAZON_SIMPLE_STORAGE_SERVICE: "amazon-s3",
      }
      const serviceRepo = _.get(overrides, service, false) || _.get(ServiceNames, service, service)
      return serviceRepo.toLowerCase().replace(/ /g, '-');
    }

    const awsgitrepo = (service: string, doctype: string): string => {
      const serviceRepo = getServiceRepo(service)
      return `https://github.com/awsdocs/${serviceRepo}-${doctype}.git`;
    }

    const doctype = getDocTypeForService(service)
    return awsgitrepo(service, doctype)
  }

  static getDocPathForService(service: string) {
    return path.join('docs', service, 'developer-guide');
  }

  static getDocTocPathForService(service: string) {
    return path.join('docs', service, 'toc.json');
  }

  static getArtifactPath() {
    return path.join("build", "artifacts")
  }

  static getArtifactPathForService(service: string, renderTargetFormat: string) {
    return path.join(this.getArtifactPath(), service, renderTargetFormat)
  }

  static getStagingPathForService(service: string) {
    return path.join('build', "staging", service);
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