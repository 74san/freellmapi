# OpenAI CLI MCP Server

An MCP (Model Context Protocol) server that wraps the OpenAI CLI, allowing Claude Code and other MCP clients to interact with OpenAI's models and APIs.

## Features

- **List Models**: Get all available OpenAI models
- **Chat Completions**: Create chat completions with configurable parameters
- **API Check**: Verify your OpenAI API key is properly configured
- **File Operations**: Upload and list files for use with GPT-4 Vision or Assistants API
- **Raw Commands**: Run arbitrary OpenAI CLI commands
- **Full API Access**: Access to the complete OpenAI CLI feature set

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- OpenAI CLI installed and accessible in your PATH
  - Install via: `npm install -g openai`
- An OpenAI API key configured:
  - Set the `OPENAI_API_KEY` environment variable
  - Or run `openai api-key` to configure it

### Build

```bash
npm install
npm run build
```

## Usage

### As a Claude Code MCP Server

Add to your Claude Code configuration (`.claude/mcp.json` or via Claude Code settings):

```json
{
  "mcpServers": {
    "openai-cli": {
      "command": "node",
      "args": ["/path/to/mcp/openai-cli/dist/index.js"]
    }
  }
}
```

Or use NPM globally:

```bash
npm install -g openai-cli-mcp-server
# In Claude Code settings, add:
# Command: openai-cli-mcp-server
```

### Available Tools

#### openai_models_list
List all available OpenAI models.

```
No parameters required
```

#### openai_api_check
Check if your OpenAI API key is configured and working.

```
No parameters required
```

#### openai_chat_completions
Create a chat completion using the OpenAI CLI.

**Parameters:**
- `message` (required): The message to send to the model
- `model` (optional): Model ID (default: gpt-3.5-turbo)
- `temperature` (optional): Generation temperature 0.0-2.0 (default: 1.0)
- `max_tokens` (optional): Maximum tokens in response (default: 2048)

#### openai_files_upload
Upload a file to OpenAI for use with GPT-4 Vision or Assistants API.

**Parameters:**
- `filepath` (required): Path to the file to upload

#### openai_files_list
List all files uploaded to your OpenAI account.

```
No parameters required
```

#### openai_raw_command
Run a raw OpenAI CLI command.

**Parameters:**
- `command` (required): The OpenAI CLI command to run (without the "openai" prefix)

**Example:**
```
Command: "chat.completions.create --model gpt-4 --message 'Hello'"
```

## Development

```bash
npm run dev
```

This will watch for changes and rebuild the TypeScript.

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)

## Troubleshooting

### "openai: command not found"
Install the OpenAI CLI:
```bash
npm install -g openai
```

### "Invalid API key"
Set your OpenAI API key:
```bash
export OPENAI_API_KEY=sk-...
# or
openai api-key
```

### MCP connection issues
Ensure the server is started and listening on stdio. Check that the command path in your MCP configuration points to the correct build output.

## License

MIT
