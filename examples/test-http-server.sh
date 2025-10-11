#!/bin/bash

# SiYuan MCP HTTP Server 测试脚本
# 演示如何使用 curl 与 HTTP 服务器交互

set -e

SERVER_URL="http://localhost:3000/mcp"
SESSION_ID=""

echo "🚀 Testing SiYuan MCP HTTP Server"
echo "=================================="
echo ""

# 1. 初始化连接
echo "📡 Step 1: Initialize connection..."
INIT_RESPONSE=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "id": 1,
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": {
        "name": "curl-test",
        "version": "1.0"
      }
    }
  }')

# 从响应中提取会话ID（需要从服务器日志或响应头获取）
echo "Response: $INIT_RESPONSE"
echo ""
echo "⚠️  Please check the server logs for the Session ID"
echo "    Or extract it from the Mcp-Session-Id response header"
echo ""

# 提示用户输入会话ID
read -p "Enter Session ID from server logs: " SESSION_ID

if [ -z "$SESSION_ID" ]; then
  echo "❌ No session ID provided. Exiting."
  exit 1
fi

echo ""
echo "✅ Using Session ID: $SESSION_ID"
echo ""

# 2. 列出工具
echo "📋 Step 2: List available tools..."
TOOLS_RESPONSE=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 2
  }')

echo "$TOOLS_RESPONSE" | jq -r '.result.tools[] | "  - \(.name): \(.description)"' 2>/dev/null || echo "$TOOLS_RESPONSE"
echo ""

# 3. 调用工具：列出笔记本
echo "📚 Step 3: List notebooks..."
NOTEBOOKS_RESPONSE=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "id": 3,
    "params": {
      "name": "list_notebooks",
      "arguments": {}
    }
  }')

echo "$NOTEBOOKS_RESPONSE" | jq -r '.result.content[0].text | fromjson | .[] | "  - \(.name) (ID: \(.id))"' 2>/dev/null || echo "$NOTEBOOKS_RESPONSE"
echo ""

# 4. 调用工具：搜索内容
echo "🔍 Step 4: Search by content..."
SEARCH_RESPONSE=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "id": 4,
    "params": {
      "name": "search_by_content",
      "arguments": {
        "content": "测试",
        "limit": 3
      }
    }
  }')

echo "$SEARCH_RESPONSE" | jq -r '.result.content[0].text | fromjson | .[] | "  - \(.content) (\(.hpath))"' 2>/dev/null || echo "$SEARCH_RESPONSE"
echo ""

# 5. 调用工具：获取最近更新的文档
echo "📄 Step 5: Get recently updated documents..."
RECENT_RESPONSE=$(curl -s -X POST "$SERVER_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "id": 5,
    "params": {
      "name": "get_recently_updated_documents",
      "arguments": {
        "limit": 5
      }
    }
  }')

echo "$RECENT_RESPONSE" | jq -r '.result.content[0].text | fromjson | .[] | "  - \(.content // .fcontent)"' 2>/dev/null || echo "$RECENT_RESPONSE"
echo ""

echo "=================================="
echo "✅ All tests completed!"
echo ""
echo "Note: Install jq for better formatted output:"
echo "  brew install jq  # macOS"
echo "  apt install jq   # Ubuntu/Debian"
