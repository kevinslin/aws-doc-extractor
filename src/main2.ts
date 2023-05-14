import fsNode from 'fs';
import fs from 'fs-extra';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node/index.js';

import _debug from "debug";
import path from 'path';
import * as url from 'url';
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
    debug({ctx, service: opts.service, tocPath, msg: "fetching toc"})
    const content = await AWSUtils.getDocTocForService(opts.service);
    fs.writeFileSync(tocPath, JSON.stringify(content, null, 2));
  }
}

// const services = ["AMAZON_ECS", "AMAZON_EC2"]
const services = ["AMAZON_EC2"]
main({ services})