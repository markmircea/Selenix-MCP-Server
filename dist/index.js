"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const bridge_client_js_1 = require("./bridge-client.js");
const tools_js_1 = require("./tools.js");
const server = new index_js_1.Server({ name: 'selenix-mcp-server', version: '1.0.0' }, { capabilities: { tools: {} } });
const bridge = new bridge_client_js_1.BridgeClient();
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
    tools: tools_js_1.TOOL_DEFINITIONS,
}));
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        const result = (await bridge.call(name, args || {}));
        // Check for bridge-level errors
        if (result && typeof result === 'object' && 'error' in result) {
            return {
                content: [
                    { type: 'text', text: `Error: ${result.error}` },
                ],
                isError: true,
            };
        }
        // Special handling for screenshot — return as image content
        if (name === 'get_screenshot' && result.screenshot) {
            const screenshotStr = result.screenshot;
            const base64Data = screenshotStr.replace(/^data:image\/\w+;base64,/, '');
            return {
                content: [
                    {
                        type: 'image',
                        data: base64Data,
                        mimeType: 'image/jpeg',
                    },
                    {
                        type: 'text',
                        text: `Screenshot of: ${result.title || 'unknown'} (${result.url || 'unknown'})`,
                    },
                ],
            };
        }
        // All other tools return text/JSON
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
}
main().catch(console.error);
//# sourceMappingURL=index.js.map