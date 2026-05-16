# headers-mcp

[![npm](https://img.shields.io/npm/v/@mukundakatta/headers-mcp.svg)](https://www.npmjs.com/package/@mukundakatta/headers-mcp)
[![mcp](https://img.shields.io/badge/protocol-MCP-blue.svg)](https://modelcontextprotocol.io)

MCP server: parse and stringify HTTP header blocks. Header names are
lowercased, repeated headers collect into arrays, `set-cookie` is always an
array.

## Tools

- `parse` — `"Content-Type: application/json\nSet-Cookie: a=1"` → `{ "content-type": "application/json", "set-cookie": ["a=1"] }`
- `stringify` — inverse

## Configure

```json
{ "mcpServers": { "headers": { "command": "npx", "args": ["-y", "@mukundakatta/headers-mcp"] } } }
```

## License

MIT.
