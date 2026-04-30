# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Gemini API (docs MCP + skills)

This repo uses **Gemini Live** and related APIs. Prefer current docs over training cutoffs.

- **MCP**: `.cursor/mcp.json` registers the official [Gemini Docs MCP](https://gemini-api-docs-mcp.dev) (`search_documentation`). In Cursor: **Settings → MCP** and confirm **gemini-api-docs-mcp** is connected; restart Cursor after changing MCP config.
- **Skills** (project): `.agents/skills/gemini-api-dev`, `gemini-live-api-dev`, and `gemini-interactions-api` (`SKILL.md` in each). Reinstall or update with  
  `npx skills add google-gemini/gemini-skills --skill <name> -y`  
  (add `--global` for user-wide install). Sandbox may block clone; run with a normal terminal if install fails.
- **Verify**: Ask the agent how to use a recent Gemini feature (for example context caching); answers should cite current SDK methods. Google’s checklist: [Set up your coding assistant with Gemini MCP and Skills](https://ai.google.dev/gemini-api/docs/coding-agents).