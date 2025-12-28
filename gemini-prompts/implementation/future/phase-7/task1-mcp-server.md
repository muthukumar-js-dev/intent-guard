# Phase 7 - Task 1: MCP Server Implementation

## Task Overview
**Phase**: 7 - AI Integration & MCP Support  
**Task**: 1 of 5  
**Estimated Time**: 1-2 weeks  
**Complexity**: Very High

---

## Objective
Implement a Model Context Protocol (MCP) server that provides just-in-time architectural rules to AI IDEs.

---

## Context
MCP allows AI assistants to query external tools for context. Our MCP server will:
- Respond to rule queries for specific files
- Provide layer boundaries
- Return protected region status
- Deliver relevant intents

This enables AI to receive rules **during code generation** instead of after.

---

## Requirements

### 1. MCP Server Core

Create `src/mcp/server.ts`:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ConfigLoader } from '../config';

export class IntentGuardMCPServer {
  private server: Server;
  private config: IntentGuardConfig;

  constructor() {
    this.server = new Server(
      {
        name: 'intent-guard',
        version: '0.3.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
  }

  private setupTools(): void {
    // Tool: Get rules for file
    this.server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name === 'get_rules_for_file') {
        return this.getRulesForFile(request.params.arguments.filePath);
      }
    });

    // Tool: Validate code snippet
    this.server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name === 'validate_snippet') {
        return this.validateSnippet(
          request.params.arguments.code,
          request.params.arguments.filePath
        );
      }
    });
  }

  private async getRulesForFile(filePath: string) {
    // Load config
    this.config = ConfigLoader.load();
    
    // Find layer
    const layer = this.findLayer(filePath);
    
    // Check protected regions
    const isProtected = this.isProtectedRegion(filePath);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            layer: layer?.name,
            canImportFrom: layer?.canImportFrom || [],
            isProtected,
            message: isProtected 
              ? 'This file is protected and requires manual review'
              : 'Follow layer import rules'
          }, null, 2)
        }
      ]
    };
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
```

### 2. MCP Tools

Implement these MCP tools:
1. **get_rules_for_file** - Returns rules for specific file path
2. **validate_snippet** - Validates code before AI applies it
3. **get_similar_intents** - Finds similar existing functions
4. **suggest_fix** - Suggests fixes for violations

### 3. CLI Integration

Add MCP server command:
```bash
npx intent-guard mcp
```

This starts the MCP server in stdio mode for AI IDE integration.

---

## Integration with AI IDEs

### Cursor Integration

Add to `.cursor/config.json`:
```json
{
  "mcpServers": {
    "intent-guard": {
      "command": "npx",
      "args": ["intent-guard", "mcp"]
    }
  }
}
```

### Claude Desktop Integration

Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "intent-guard": {
      "command": "npx",
      "args": ["intent-guard", "mcp"]
    }
  }
}
```

---

## Success Criteria

- ✅ MCP server starts and responds <50ms
- ✅ Integrates with Cursor IDE
- ✅ Integrates with Claude Desktop
- ✅ Provides accurate rules for files
- ✅ Validates code snippets correctly
- ✅ All MCP tools work

---

## Performance Requirements

- Response time: <50ms per query
- Concurrent requests: Support 10+ simultaneous
- Memory usage: <200MB

---

**Task Version**: 1.0.0  
**Created**: 2025-12-28  
**Status**: Ready for Implementation
