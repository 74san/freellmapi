#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';

interface ToolCall {
  name: string;
  args: Record<string, string | number | boolean>;
}

class OpenAICLIServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'openai-cli-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getAvailableTools(),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return await this.handleToolCall(request);
    });
  }

  private getAvailableTools(): Tool[] {
    return [
      {
        name: 'openai_models_list',
        description:
          'List all available OpenAI models using: openai models list',
        inputSchema: {
          type: 'object' as const,
          properties: {},
          required: [],
        },
      },
      {
        name: 'openai_api_check',
        description:
          'Check if the OpenAI API key is set and can authenticate using: openai api check',
        inputSchema: {
          type: 'object' as const,
          properties: {},
          required: [],
        },
      },
      {
        name: 'openai_chat_completions',
        description:
          'Create a chat completion using the OpenAI CLI. Requires a message and optionally model, temperature, and max_tokens.',
        inputSchema: {
          type: 'object' as const,
          properties: {
            message: {
              type: 'string',
              description: 'The message to send to the model',
            },
            model: {
              type: 'string',
              description: 'The model ID to use (e.g., gpt-4, gpt-3.5-turbo)',
              default: 'gpt-3.5-turbo',
            },
            temperature: {
              type: 'number',
              description: 'Temperature for generation (0.0-2.0)',
              default: 1.0,
            },
            max_tokens: {
              type: 'number',
              description: 'Maximum tokens in response',
              default: 2048,
            },
          },
          required: ['message'],
        },
      },
      {
        name: 'openai_files_upload',
        description:
          'Upload a file to OpenAI for use with models like GPT-4 Vision or Assistants API',
        inputSchema: {
          type: 'object' as const,
          properties: {
            filepath: {
              type: 'string',
              description: 'Path to the file to upload',
            },
          },
          required: ['filepath'],
        },
      },
      {
        name: 'openai_files_list',
        description: 'List all files uploaded to your OpenAI account',
        inputSchema: {
          type: 'object' as const,
          properties: {},
          required: [],
        },
      },
      {
        name: 'openai_raw_command',
        description:
          'Run a raw OpenAI CLI command. Pass the full command after "openai".',
        inputSchema: {
          type: 'object' as const,
          properties: {
            command: {
              type: 'string',
              description: 'The OpenAI CLI command to run (without the "openai" prefix)',
            },
          },
          required: ['command'],
        },
      },
    ];
  }

  private async handleToolCall(request: any) {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'openai_models_list':
          return await this.runOpenAICommand('models list');
        case 'openai_api_check':
          return await this.runOpenAICommand('api check');
        case 'openai_chat_completions':
          return await this.handleChatCompletion(args);
        case 'openai_files_upload':
          return await this.handleFileUpload(args);
        case 'openai_files_list':
          return await this.runOpenAICommand('files list');
        case 'openai_raw_command':
          return await this.runOpenAICommand(args.command);
        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown tool: ${name}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message || String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleChatCompletion(args: any) {
    const { message, model = 'gpt-3.5-turbo', temperature = 1.0, max_tokens = 2048 } = args;

    const commandParts = [
      'chat.completions.create',
      `--model ${model}`,
      `--temperature ${temperature}`,
      `--max-tokens ${max_tokens}`,
      `--message "${message.replace(/"/g, '\\"')}"`,
    ];

    return await this.runOpenAICommand(commandParts.join(' '));
  }

  private async handleFileUpload(args: any) {
    const { filepath } = args;
    const commandParts = ['files.upload', `--file "${filepath}"`];

    return await this.runOpenAICommand(commandParts.join(' '));
  }

  private async runOpenAICommand(command: string) {
    return new Promise((resolve) => {
      try {
        const fullCommand = `openai ${command}`;
        const output = execSync(fullCommand, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        resolve({
          content: [
            {
              type: 'text',
              text: output,
            },
          ],
        });
      } catch (error: any) {
        resolve({
          content: [
            {
              type: 'text',
              text: `Command failed: ${error.message}\nStdout: ${error.stdout || ''}\nStderr: ${error.stderr || ''}`,
            },
          ],
          isError: true,
        });
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('OpenAI CLI MCP Server started');
  }
}

const server = new OpenAICLIServer();
server.run().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
