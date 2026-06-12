/**
 * mock-handler-with-adapter.js
 *
 * Test fixture — handler that captures the injected adapter.
 * Used to verify that FormatRegistry injects the correct SyntaxAdapter.
 */

export async function initFormat(formatJson, adapter) {
  const formatName = formatJson.name ?? 'mock';

  return {
    _adapter: adapter,
    async claim(_rawContent) { return false; },
    async read(_path, _rootRegistry, _query) { return { format: formatName }; },
    async write(_path, _rootRegistry, _payload) {},
    async create(_path, _rootRegistry) {},
    describe() {
      return { description: `Mock handler (with adapter) for ${formatName}`, example: {} };
    }
  };
}
