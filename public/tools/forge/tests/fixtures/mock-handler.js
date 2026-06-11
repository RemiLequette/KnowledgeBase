/**
 * mock-handler.js
 *
 * Test fixture — configurable format handler for format registry tests.
 *
 * initFormat(formatJson) returns a run handler whose claim() behavior
 * is controlled by formatJson.claimResult (default: false).
 *
 * Usage in forge-formats.json fixture:
 *   "handler": "./mock-handler.js",
 *   "claimResult": true   ← this handler will claim every file
 */

export async function initFormat(formatJson) {
  const claimResult = formatJson.claimResult ?? false;
  const formatName  = formatJson.name ?? 'mock';

  return {
    async claim(_rawContent) {
      return claimResult;
    },
    async read(_path, _rootRegistry, _query) {
      return { format: formatName, content: 'mock-read' };
    },
    async write(_path, _rootRegistry, _payload) {},
    async create(_path, _rootRegistry) {},
    describe() {
      return {
        description: `Mock handler for ${formatName}`,
        example:     { format: formatName }
      };
    }
  };
}
