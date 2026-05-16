#!/usr/bin/env node
/**
 * headers MCP server. Two tools: `parse`, `stringify`.
 *
 * Parse an HTTP header block (one header per line, `Name: value`) into a
 * map. Names are lowercased. Repeated headers collect into arrays — except
 * `set-cookie` which always returns an array even when there's only one.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const VERSION = '0.1.0';

export type Headers = Record<string, string | string[]>;

export function parse(text: string): Headers {
  const out: Headers = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const name = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (name === 'set-cookie') {
      const prev = out[name];
      if (Array.isArray(prev)) prev.push(value);
      else out[name] = [value];
      continue;
    }
    const prev = out[name];
    if (prev === undefined) out[name] = value;
    else if (Array.isArray(prev)) prev.push(value);
    else out[name] = [prev, value];
  }
  return out;
}

export function stringify(headers: Headers): string {
  const lines: string[] = [];
  for (const [name, value] of Object.entries(headers)) {
    if (Array.isArray(value)) for (const v of value) lines.push(`${name}: ${v}`);
    else lines.push(`${name}: ${value}`);
  }
  return lines.join('\r\n');
}

const server = new Server({ name: 'headers', version: VERSION }, { capabilities: { tools: {} } });

const TOOLS = [
  {
    name: 'parse',
    description:
      'Parse an HTTP header block into a map. Names are lowercased; repeated headers collect into arrays. set-cookie is always an array.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text'],
    },
  },
  {
    name: 'stringify',
    description: 'Serialize a header map back to `Name: value` lines, CRLF-separated.',
    inputSchema: {
      type: 'object',
      properties: { headers: { type: 'object' } },
      required: ['headers'],
    },
  },
] as const;

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name === 'parse') {
      const a = args as unknown as { text: string };
      return jsonResult({ headers: parse(a.text) });
    }
    if (name === 'stringify') {
      const a = args as unknown as { headers: Headers };
      return textResult(stringify(a.headers));
    }
    return errorResult('unknown tool: ' + name);
  } catch (err) {
    return errorResult('headers failed: ' + (err as Error).message);
  }
});

function jsonResult(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
function textResult(text: string) {
  return { content: [{ type: 'text', text }] };
}
function errorResult(message: string) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`headers MCP server v${VERSION} ready on stdio\n`);
}
