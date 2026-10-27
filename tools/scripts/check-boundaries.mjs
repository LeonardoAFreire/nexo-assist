import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const workspaceRoot = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const workspaceFolders = ['apps', 'packages'];
const dependencyFields = ['dependencies', 'devDependencies', 'peerDependencies'];
const SHARED_TAG = 'shared';
const APP_TAG = 'app';
const DOMAIN_PREFIX = 'domain:';

function listPackages() {
  return workspaceFolders.flatMap((folder) => {
    const base = join(workspaceRoot, folder);
    if (!existsSync(base)) return [];
    return readdirSync(base)
      .map((name) => join(base, name, 'package.json'))
      .filter((file) => existsSync(file))
      .map((file) => JSON.parse(readFileSync(file, 'utf8')));
  });
}

function tagOf(pkg) {
  return pkg.nexo?.tag;
}

function workspaceDependencies(pkg, names) {
  return dependencyFields
    .flatMap((field) => Object.keys(pkg[field] ?? {}))
    .filter((name) => names.has(name));
}

function violationsOf(pkg, tagsByName) {
  const tag = tagOf(pkg);
  if (!tag) return [`${pkg.name}: sem "nexo.tag" no package.json`];
  if (tag === APP_TAG) return [];
  return workspaceDependencies(pkg, new Set(tagsByName.keys()))
    .filter((dependency) => !isAllowed(tag, tagsByName.get(dependency)))
    .map(
      (dependency) =>
        `${pkg.name} (${tag}) não pode depender de ${dependency} (${tagsByName.get(dependency)})`,
    );
}

function isAllowed(fromTag, toTag) {
  if (toTag === SHARED_TAG) return true;
  if (fromTag === SHARED_TAG) return false;
  return fromTag === toTag && fromTag.startsWith(DOMAIN_PREFIX);
}

const packages = listPackages();
const tagsByName = new Map(packages.map((pkg) => [pkg.name, tagOf(pkg)]));
const violations = packages.flatMap((pkg) => violationsOf(pkg, tagsByName));

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exit(1);
}
console.log(`Fronteiras OK (${packages.length} pacotes verificados)`);
