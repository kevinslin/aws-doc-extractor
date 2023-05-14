import fs from 'fs-extra';
import fsNode from 'fs';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node/index.js';

import { ServiceNames } from './constants/aws.js';
import _ from 'lodash';
import path from 'path';
import _debug from "debug";
import * as url from 'url';
import { json } from 'stream/consumers';
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

// ===
async function main(opts: { services: string[] }) {
  debug("start...")
  const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
  const BASEDIR = path.dirname(path.join(__dirname, "..", 'package.json'));
  debug({BASEDIR})

  await Promise.all(
    opts.services.map(async (service) => {
      await upsertDevGuide({ service, basedir: BASEDIR });
      await upsertToc({ service, basedir: BASEDIR });
    })
  );
}

async function upsertDevGuide(opts: { service: string, basedir: string }) {
  const ctx = "upsertDevGuide";
  const guidePath = path.join(opts.basedir, 'docs', opts.service, 'developer-guide');
  debug({ctx, service: opts.service, guidePath})
  if (!await isGitRepo(guidePath)) {
    const url = AWSUtils.getDocRepoForService(opts.service);
    debug({ctx, service: opts.service, url, msg: "no repo found, cloning"})
    fs.ensureDirSync(guidePath);
    await git.clone({
      fs: fsNode,
      dir: guidePath,
      url,
      http,
    });
  } else {
    debug({ctx, service: opts.service, msg: "repo found, pulling"})
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
  const tocPath = path.join(opts.basedir, 'docs', opts.service, 'toc.json');
  debug({ctx, service: opts.service, tocPath, msg: "enter"})
  if (!fs.existsSync(tocPath)) {
    const serviceNameNoSpaces = _.get(ServiceNames, opts.service, opts.service).replace(' ', '');
    debug({ctx, service: opts.service, tocPath, msg: "fetching toc"})
    const resp = await fetch(`https://docs.aws.amazon.com/${serviceNameNoSpaces}/latest/userguide/toc-contents.json`);
    const content = await resp.json();
    fs.writeFileSync(tocPath, JSON.stringify(content, null, 2));
  }
}

const services = ["AMAZON_ECS", "AMAZON_EC2"]
main({ services})