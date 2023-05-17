import _ from "lodash";
import { ServiceNames } from "../constants/aws.js";
import { ServiceMetadata } from "../types/index.js";
import { AWSConstants } from "../utils/aws.js";
import fs from "fs-extra";


async function main() {
  const services: Required<ServiceMetadata>[] = fs.readJsonSync('data/all_services.clean.json');
  
  let servicesClean = services.filter(s => s.git_repo && s.toc_url && s.doc_url)
  console.log(`services: ${services.length}, servicesClean: ${servicesClean.length}`)
  servicesClean.forEach((service) => {
    const name = AWSConstants.normalizeServiceName(service.name);
    service.norm_name = name;
  });
  fs.writeJSONSync('data/all_services.clean.1-with_links.json', servicesClean, { spaces: 2 });
}

main();