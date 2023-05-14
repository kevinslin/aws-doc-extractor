import fsNode from 'fs';
import fs from 'fs-extra';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node/index.js';

import _debug from "debug";
import path from 'path';
import * as url from 'url';
import { AWSUtils } from './utils/aws.js';
import { TargetFormat, SkipStepsOptions } from './types/index.js';
import { extractNotesFromService } from './core/extractNotesFromService.js';
import { ServiceNames } from './constants/aws.js';
import _ from 'lodash';
import { z } from 'zod';
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
function generateSiteToc(opts: { prefix: string; services: string[]; basedir: string, renderTargetFormat: TargetFormat }) {
  const { prefix, services } = opts;
  const out: string[] = [];
  out.push(prefix);

  services.forEach((service) => {
    const artifactDirForServiceAndTargetFormat = path.join(opts.basedir,
      AWSUtils.getArtifactPathForService(service, opts.renderTargetFormat));
    const summaryPath = path.join(artifactDirForServiceAndTargetFormat, `SUMMARY.${service}.md`);
    const contents = fs.readFileSync(summaryPath, "utf-8");
    const serviceName = _.get(ServiceNames, service, service)
    out.push(`- ${serviceName}\n${contents}`);
    fs.removeSync(summaryPath);
  });
  return out.join("\n");
}


export async function main(opts: { services: string[], skipSteps: z.infer<typeof SkipStepsOptions>[] }) {
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
    await Promise.all(
      opts.services.map(async (service) => {
        await upsertDevGuide({ service, basedir: BASEDIR });
        await upsertToc({ service, basedir: BASEDIR });
      })
    );
  }

  // TODO: extractNotesFromService
  for (const service of opts.services) {
    await extractNotesFromService({ basedir: BASEDIR, service })
  }

  if (opts.skipSteps.includes(SkipStepsOptions.Enum.generateToc)) {
    debug({ ctx, msg: "skipping toc generation" })
  } else {
    const prefix = `## About
- [README](./../README.md)

## Services
`;
    // generate site toc
    const tocContents = generateSiteToc({ prefix, services: opts.services, basedir: BASEDIR, renderTargetFormat });
    fs.writeFileSync(
      path.join(AWSUtils.getArtifactPath(), "SUMMARY.md")
      , tocContents);

  }
}

async function upsertDevGuide(opts: { service: string, basedir: string }) {
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
    debug({ ctx, service: opts.service, msg: "repo found, pulling" })
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

async function upsertToc(opts: { service: string, basedir: string }) {
  const ctx = "upsertToc";
  const tocPath = path.join(opts.basedir, AWSUtils.getDocTocPathForService(opts.service));
  debug({ ctx, service: opts.service, tocPath, msg: "enter" })
  if (!fs.existsSync(tocPath)) {
    debug({ ctx, service: opts.service, tocPath, msg: "fetching toc" })
    const content = await AWSUtils.getDocTocForService(opts.service);
    fs.writeFileSync(tocPath, JSON.stringify(content, null, 2));
  }
}

// const services = ["AMAZON_ECS", "AMAZON_EC2", "AWS_LAMBDA"]
// const services = ["AWS_LAMBDA"]
// const services = ["AMAZON_ECS"]
// main({ services })