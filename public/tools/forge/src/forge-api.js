// @forge-type: js-managed

// ====[ imports ]====

import { log }             from './logger.js';
import { parseFAL, toFAL } from './fal.js';
import { TypeRegistry }    from './type-registry.js';
import { RootRegistry }    from './root-registry.js';

// ====[ forge-session ]====

/**
 * forge-api.js
 *
 * Forge functional API — protocol-independent.
 *
 * ForgeSession is a thin orchestration layer over TypeRegistry and RootRegistry.
 * It owns no logic — Brand registry and gates live in TypeRegistry.
 *
 * ForgeSession responsibilities:
 *   - ls(): separate folders (FAL construction) from artifacts (TypeRegistry.discover)
 *   - All other operations: parse FAL → delegate to TypeRegistry or RootRegistry
 *
 * mcp-tools.js and any future protocol adapter (HTTPS, CLI…) are thin
 * wrappers over this API — they parse protocol arguments, call the session,
 * and format the protocol response.
 *
 * Tests import ForgeSession directly and call session methods — no dispatch,
 * no MCP response parsing.
 *
 * ls() return shapes — always an object:
 *   No fal       → { roots: [{ fal, folder: true }] }
 *   Folder FAL   → { fal, count, entries: [{ fal, folder: true } | { fal, type }] }
 *   Artifact FAL → { fal, entries: [{ name, type }] }
 *
 * References:
 *   - conventions/forge.md [section MCP tools]
 *   - conventions/forge.md [section Brand principle]
 *   - conventions/forge.md [section RTFM principle]
 */
export class ForgeSession {
  /**
   * @param {TypeRegistry} typeRegistry
   * @param {RootRegistry} rootRegistry
   */
  constructor(typeRegistry, rootRegistry) {
    this.typeRegistry = typeRegistry;
    this.rootRegistry = rootRegistry;
  }

  // ====[ ping ]====

  ping() {
    log('INFO', 'ping');
    return 'pong — forge v3.0.0';
  }

  // ====[ ls ]====

  async ls(fal) {
    log('INFO', `ls — fal: ${fal || '(none)'}`);

    // roots
    if (!fal) {
      const entries = this.rootRegistry.rootRefs().map(ref => ({ fal: toFAL(ref), folder: true }));
      return { roots: entries };
    }

    const ref = parseFAL(fal);

    // folder
    if (!ref.name) {
      const { folders, artifacts } = await this.rootRegistry.list(ref);
      const entries = [];
      for (const folderUrlRef of folders) {
        entries.push({ fal: toFAL(folderUrlRef), folder: true });
      }
      for (const artifactUrlRef of artifacts) {
        const artifactRef = await this.typeRegistry.discover(artifactUrlRef, this.rootRegistry);
        entries.push({ fal: toFAL(artifactRef), type: artifactRef.type });
      }
      return { fal, count: entries.length, entries };
    }

    // artifact node — wrap handler result for consistent { fal, entries } shape
    const nodes = await this.typeRegistry.ls(ref, this.rootRegistry);
    return { fal, entries: nodes };
  }

  // ====[ describe ]====

  describe(fal) {
    log('INFO', `describe — fal: ${fal}`);
    const ref = parseFAL(fal);
    if (!ref.name) {
      // Folder FAL — return a generic folder description
      return {
        recognition:  'A folder FAL — a navigable container with no type. Use forge_ls to list its contents.',
        capabilities: { read: false, write: false, blocks: false },
        usage:        'forge_ls(fal) lists the folder contents.'
      };
    }
    return this.typeRegistry.describe(ref);
  }

  // ====[ read ]====

  /** ref.block carries the block path ('' = full content). */
  async read(fal) {
    log('INFO', `read — fal: ${fal}`);
    return this.typeRegistry.read(parseFAL(fal, 'artifact'), this.rootRegistry);
  }

  // ====[ create ]====

  async create(fal) {
    log('INFO', `create — fal: ${fal}`);
    await this.typeRegistry.createArtifact(parseFAL(fal, 'artifact'), this.rootRegistry);
  }

  // ====[ write ]====

  /** block is integrated into ref before delegating to typeRegistry. */
  async write(fal, block = '', content) {
    log('INFO', `write — fal: ${fal}, block: "${block}", ${content?.length ?? 0} chars`);
    if (content === undefined || content === null) throw new Error('write requires content.');
    const ref = parseFAL(fal, 'artifact');
    ref.block = block;
    await this.typeRegistry.write(ref, this.rootRegistry, content);
  }

  // ====[ is-block ]====

  /** ref.block carries the target path. */
  async isBlock(fal) {
    log('INFO', `isBlock — fal: ${fal}`);
    return this.typeRegistry.isBlock(parseFAL(fal, 'artifact'), this.rootRegistry);
  }

  // ====[ delete ]====

  /** Deletes artifact (no block) or block (ref.block set). */
  async delete(fal) {
    log('INFO', `delete — fal: ${fal}`);
    const ref = parseFAL(fal, 'artifact');
    if (ref.block !== '') {
      await this.typeRegistry.deleteBlock(ref, this.rootRegistry);
    } else {
      await this.typeRegistry.deleteArtifact(ref, this.rootRegistry);
    }
  }

  // ====[ mkdir ]====

  async mkdir(fal) {
    log('INFO', `mkdir — fal: ${fal}`);
    await this.rootRegistry.mkdir(parseFAL(fal, 'folder'));
  }

  // ====[ rmdir ]====

  async rmdir(fal) {
    log('INFO', `rmdir — fal: ${fal}`);
    await this.rootRegistry.rmdir(parseFAL(fal, 'folder'));
  }

  // ====[ mvdir ]====

  async mvdir(fal, target) {
    log('INFO', `mvdir — fal: ${fal}, target: ${target}`);
    await this.rootRegistry.mvdir(parseFAL(fal, 'folder'), parseFAL(target, 'folder'));
  }

  // ====[ rndir ]====

  async rndir(fal, name) {
    log('INFO', `rndir — fal: ${fal}, name: ${name}`);
    if (!name) throw new Error('rndir requires a name.');
    await this.rootRegistry.rndir(parseFAL(fal, 'folder'), name);
  }

}

// ====[ factory ]====

/**
 * Create a ForgeSession from a config object.
 * @param {{ roots, types }} config
 * @returns {Promise<ForgeSession>}
 */
export async function createSession(config) {
  const typeRegistry = new TypeRegistry();
  await typeRegistry.load(config.types);
  const rootRegistry = new RootRegistry();
  await rootRegistry.load(config.roots);
  return new ForgeSession(typeRegistry, rootRegistry);
}
