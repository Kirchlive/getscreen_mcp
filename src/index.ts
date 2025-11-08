#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import screenshot from "screenshot-desktop";
import sharp from "sharp";

// Tool definitions
const SCREENSHOT_TOOL: Tool = {
  name: "screenshot",
  description:
    "Captures screenshots from all available monitors and returns them as compressed images. " +
    "This tool automatically detects and captures all connected displays, returning high-quality " +
    "compressed images optimized for fast transmission to the model.",
  inputSchema: {
    type: "object",
    properties: {
      quality: {
        type: "number",
        description: "JPEG compression quality (1-100). Default: 80. Higher values = better quality but larger size.",
        minimum: 1,
        maximum: 100,
      },
      maxWidth: {
        type: "number",
        description: "Maximum width in pixels. Images will be resized proportionally if larger. Default: no limit.",
        minimum: 100,
      },
    },
  },
};

// Server setup
const server = new Server(
  {
    name: "getscreen",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [SCREENSHOT_TOOL],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "screenshot") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const quality = (request.params.arguments?.quality as number) ?? 80;
  const maxWidth = request.params.arguments?.maxWidth as number | undefined;

  try {
    // Get all available displays
    const displays = await screenshot.listDisplays();

    // Capture screenshots from all monitors in parallel
    const screenshotPromises = displays.map(async (display) => {
      const imgBuffer = await screenshot({ screen: display.id });

      // Compress and optionally resize using sharp
      let sharpInstance = sharp(imgBuffer).jpeg({ quality });

      if (maxWidth) {
        sharpInstance = sharpInstance.resize(maxWidth, null, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      const compressed = await sharpInstance.toBuffer();
      const base64 = compressed.toString("base64");

      return {
        displayId: display.id,
        displayName: display.name,
        data: base64,
        mimeType: "image/jpeg",
      };
    });

    const screenshots = await Promise.all(screenshotPromises);

    // Return results with embedded images
    return {
      content: screenshots.map((shot) => ({
        type: "image" as const,
        data: shot.data,
        mimeType: shot.mimeType,
      })),
      isError: false,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text" as const,
          text: `Failed to capture screenshots: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GetScreen MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
