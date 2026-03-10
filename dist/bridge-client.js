"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BridgeClient = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
const http_1 = __importDefault(require("http"));
const CONFIG_PATH = (0, path_1.join)((0, os_1.homedir)(), '.selenix', 'bridge.json');
function readConfig() {
    try {
        return JSON.parse((0, fs_1.readFileSync)(CONFIG_PATH, 'utf-8'));
    }
    catch {
        throw new Error(`Cannot read Selenix bridge config at ${CONFIG_PATH}. ` +
            'Make sure Selenix is running and MCP Server is enabled in Settings.');
    }
}
class BridgeClient {
    async call(endpoint, body = {}) {
        // Re-read config on every call so we pick up new tokens after Selenix restarts
        const config = readConfig();
        return new Promise((resolve, reject) => {
            const data = JSON.stringify(body);
            const req = http_1.default.request({
                hostname: '127.0.0.1',
                port: config.port,
                path: `/api/${endpoint}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${config.token}`,
                    'Content-Length': Buffer.byteLength(data),
                },
                timeout: 180000, // 3 minutes for long-running operations like run_test
            }, (res) => {
                let responseData = '';
                res.on('data', (chunk) => (responseData += chunk));
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(responseData));
                    }
                    catch {
                        resolve({ raw: responseData });
                    }
                });
            });
            req.on('error', (err) => reject(new Error(`Cannot connect to Selenix bridge at 127.0.0.1:${config.port}. ` +
                `Is Selenix running with MCP Server enabled? (${err.message})`)));
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timed out after 180 seconds'));
            });
            req.write(data);
            req.end();
        });
    }
}
exports.BridgeClient = BridgeClient;
//# sourceMappingURL=bridge-client.js.map