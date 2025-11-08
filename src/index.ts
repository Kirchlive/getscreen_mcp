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
import { execSync } from "child_process";
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

// Detect if running in WSL
function isWSL(): boolean {
  try {
    if (existsSync("/proc/version")) {
      const procVersion = readFileSync("/proc/version", "utf8");
      return /microsoft|WSL/i.test(procVersion);
    }
    return false;
  } catch {
    return false;
  }
}

// Capture screenshot using PowerShell on Windows (called from WSL)
async function captureScreenshotWSL(
  quality: number,
  maxWidth?: number
): Promise<Array<{ data: string; mimeType: string }>> {
  // PowerShell script to capture all screens and return as base64
  const psScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$screens = [System.Windows.Forms.Screen]::AllScreens
$results = @()

foreach ($screen in $screens) {
    $bounds = $screen.Bounds
    $bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)

    $ms = New-Object System.IO.MemoryStream
    $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bytes = $ms.ToArray()
    $base64 = [Convert]::ToBase64String($bytes)

    Write-Output "SCREENSHOT_START"
    Write-Output $base64
    Write-Output "SCREENSHOT_END"

    $graphics.Dispose()
    $bitmap.Dispose()
    $ms.Dispose()
}
`;

  // Create a temporary PowerShell script file to avoid escaping issues
  const tempDir = tmpdir();
  const scriptPath = join(tempDir, `getscreen-${Date.now()}.ps1`);

  try {
    // Write PowerShell script to temporary file
    writeFileSync(scriptPath, psScript, { encoding: "utf8" });

    // Execute PowerShell script from file
    const output = execSync(`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`, {
      encoding: "utf8",
      maxBuffer: 100 * 1024 * 1024, // 100MB buffer for large screenshots
    });

    // Parse the output to extract base64 screenshots
    const screenshots: Array<{ data: string; mimeType: string }> = [];
    const regex = /SCREENSHOT_START\s+([\s\S]+?)\s+SCREENSHOT_END/g;
    let match;

    while ((match = regex.exec(output)) !== null) {
      const pngBase64 = match[1].trim();
      const pngBuffer = Buffer.from(pngBase64, "base64");

      // Convert PNG to JPEG with compression using sharp
      let sharpInstance = sharp(pngBuffer).jpeg({ quality });

      if (maxWidth) {
        sharpInstance = sharpInstance.resize(maxWidth, null, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      const compressed = await sharpInstance.toBuffer();
      const base64 = compressed.toString("base64");

      screenshots.push({
        data: base64,
        mimeType: "image/jpeg",
      });
    }

    return screenshots;
  } catch (error) {
    throw new Error(
      `Failed to capture screenshots via PowerShell: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    // Clean up temporary file
    try {
      unlinkSync(scriptPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

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
    let screenshots: Array<{ data: string; mimeType: string }>;

    // Check if running in WSL
    if (isWSL()) {
      // Use PowerShell to capture screenshots on Windows host
      screenshots = await captureScreenshotWSL(quality, maxWidth);
    } else {
      // Use native screenshot-desktop for Linux/macOS
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
          data: base64,
          mimeType: "image/jpeg",
        };
      });

      screenshots = await Promise.all(screenshotPromises);
    }

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
