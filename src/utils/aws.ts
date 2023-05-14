import { VFile } from "vfile";
import { Section } from "../types/index.js";
import _ from "lodash";
import { ServiceNames } from "../constants/aws.js";

export class AWSUtils {
  static getSections(vfile: VFile): Section[] {
    return vfile.data.sections as Section[]
  }

  static getDocRepoForService(service: string) {
    const getDocTypeForService = (service: string) => {
      const overrides = {
        AMAZON_EC2: "user-guide"
      }
      if (service in overrides) {
        // @ts-ignore
        return overrides[service]
      }
      return "developer-guide"
    }
    const awsgitrepo = (service: string, doctype: string): string => {
      const serviceRepo = _.get(ServiceNames, service, service).toLowerCase().replace(' ', '-');
      // eg. https://github.com/awsdocs/amazon-ecs-developer-guide.git
      return `https://github.com/awsdocs/${serviceRepo}-${doctype}.git`;
    }

    const doctype = getDocTypeForService(service)
    return awsgitrepo(service, doctype)
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