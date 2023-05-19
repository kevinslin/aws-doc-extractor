import fsNode from 'fs';
import fs from 'fs-extra';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node/index.js';

import _debug from "debug";
import _ from 'lodash';
import path from 'path';
import * as url from 'url';
import { z } from 'zod';
import { extractNotesFromService } from './core/extractNotesFromService.js';
import { ServiceMetadata, SkipStepsOptions, TargetFormat } from './types/index.js';
import { AWSUtils } from './utils/aws.js';
const debug = _debug("main")

// --- utils

async function isGitRepo(path: string): Promise<boolean> {
  try {
    const out = await git.resolveRef({ fs: fsNode, dir: path, ref: 'HEAD' });
    return true;
  } catch (error) {
    return false;
  }
}

// --- Main
function generateSiteToc(opts: { prefix: string; services: ServiceMetadata[]; basedir: string, renderTargetFormat: TargetFormat }) {
  const { prefix, services } = opts;
  const out: string[] = [];
  out.push(prefix);
  const ctx = "generateSiteToc";

  const generateTocForGroup = (services: ServiceMetadata[], category: string) => {
    out.push(`## ${category}`);
    services.forEach((service) => {
      const artifactDirForServiceAndTargetFormat = path.join(opts.basedir,
        AWSUtils.getArtifactPathForService(service, opts.renderTargetFormat));
      const summaryPath = path.join(artifactDirForServiceAndTargetFormat, `SUMMARY.${service.norm_name}.md`);
      const contents = fs.readFileSync(summaryPath, "utf-8");
      // check if empty
      if (contents.split("\n").length === 2 ) {
        debug({ ctx, msg: "skipping", service: service.name, summaryPath });
        return
      }
      const serviceName = service.name;
      out.push(`- ${serviceName}\n${contents}`);
    });
  };

  const groups = _.groupBy(services, (service) => service.category)
  _.forEach(groups, (services, category) => {
    generateTocForGroup(services, category);
  });

  return out.join("\n");
}


export async function main(opts: { services: ServiceMetadata[], skipSteps: z.infer<typeof SkipStepsOptions>[] }) {
  const ctx = "main"
  debug({ ctx, opts, msg: "enter" })
  const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
  const BASEDIR = path.dirname(path.join(__dirname, "..", 'package.json'));
  const renderTargetFormat = TargetFormat["md.multi-page.dendron"];
  debug({ BASEDIR })

  // download raw docs
  if (opts.skipSteps.includes(SkipStepsOptions.Enum.fetchDocs)) {
    debug({ ctx, msg: "skipping fetchDocs" })
  } else {
    for (const service of opts.services) {
      await upsertDevGuide({ service, basedir: BASEDIR, skipPull: opts.skipSteps.includes(SkipStepsOptions.Enum.pullDocs) });
      await upsertToc({ service, basedir: BASEDIR });
    }
  }

  // TODO: extractNotesFromService
  if (opts.skipSteps.includes(SkipStepsOptions.Enum.extractNotes)) {
    debug({ ctx, msg: "skipping extractNotes" })
  } else {
    for (const service of opts.services) {
      const url = AWSUtils.getDocRepoForService(service);
      const source = {
        title: "AWS Developer Guide",
        url
      }
      await extractNotesFromService({ basedir: BASEDIR, service, sources: [source] })
    }
  }

  if (opts.skipSteps.includes(SkipStepsOptions.Enum.generateToc)) {
    debug({ ctx, msg: "skipping toc generation" })
  } else {
    const prefix = `## About
- [README](./../README.md)

`;
    // generate site toc
    const tocContents = generateSiteToc({ prefix, services: opts.services, basedir: BASEDIR, renderTargetFormat });
    fs.writeFileSync(
      path.join(AWSUtils.getArtifactPath(), "SUMMARY.md")
      , tocContents);

  }
}

async function upsertDevGuide(opts: { service: ServiceMetadata, basedir: string, skipPull?: boolean }) {
  const ctx = "upsertDevGuide";
  const guidePath = path.join(opts.basedir, AWSUtils.getDocPathForService(opts.service));
  debug({ ctx, service: opts.service, guidePath })
  if (!await isGitRepo(guidePath)) {
    const url = AWSUtils.getDocRepoForService(opts.service);
    debug({ ctx, service: opts.service, url, msg: "no repo found, cloning" })
    fs.ensureDirSync(guidePath);
    await git.clone({
      fs: fsNode,
      dir: guidePath,
      url,
      http,
    });
  } else {
    debug({ ctx, service: opts.service, msg: "repo found" })
    if (opts.skipPull) {
      return
    }
    debug({ ctx, service: opts.service, msg: "pulling" })
    await git.pull({
      fs: fsNode,
      dir: guidePath,
      http,
      author: {
        name: 'DendronBot',
        email: 'support@dendron.so',
      }
    });
  }
}

async function upsertToc(opts: { service: ServiceMetadata, basedir: string }) {
  const ctx = "upsertToc";
  const tocPath = path.join(opts.basedir, AWSUtils.getDocTocPathForService(opts.service));
  debug({ ctx, service: opts.service, tocPath, msg: "enter" })
  if (!fs.existsSync(tocPath)) {
    debug({ ctx, service: opts.service, tocPath, msg: "fetching toc" })
    try {
      const content = await AWSUtils.getDocTocForService(opts.service);
      fs.writeFileSync(tocPath, JSON.stringify(content, null, 2));
    } catch (err) {
      console.log({ service: opts.service.name, err })
      throw err
    }
  }
}

// const services = ["AMAZON_ECS", "AMAZON_EC2", "AWS_LAMBDA"]
// const services = ["AWS_LAMBDA"]
// const services = ["AMAZON_ECS"]
// main({ services })