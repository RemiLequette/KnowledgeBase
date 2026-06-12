/**
 * mock-tool-handler.js
 *
 * Test fixture — configurable tool handler for mcp-server tests.
 *
 * initTool(toolJson) returns a handler whose execute() behavior
 * is controlled by toolJson:
 *   - toolJson.result      → value returned by execute() (default: { ok: 'mock' })
 *   - toolJson.shouldThrow → if true, execute() throws an Error with toolJson.errorMessage
 *
 * Usage in forge-tools.json fixture:
 *   "handler": "./mock-tool-handler.js",
 *   "result": { "format": "doc", "why": "..." }   ← returned by execute()
 *   "shouldThrow": true                            ← execute() throws
 */

export async function initTool(toolJson) {
  const result      = toolJson.result      ?? { ok: 'mock' };
  const shouldThrow = toolJson.shouldThrow ?? false;
  const errorMsg    = toolJson.errorMessage ?? 'mock-tool-error';

  return {
    async execute(input) {
      if (shouldThrow) throw new Error(errorMsg);
      return { ...result, _input: input };
    }
  };
}
