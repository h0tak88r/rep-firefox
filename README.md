<p align="center">
  <!-- Firefox Supported -->
  <img src="https://img.shields.io/badge/Firefox-Supported-FF7139?logo=firefox&logoColor=white" alt="Firefox Supported">

  <!-- AppSec Tool -->
  <img src="https://img.shields.io/badge/AppSec-Tool-blueviolet" alt="AppSec Tool">

  <!-- Bug Bounty Friendly -->
  <img src="https://img.shields.io/badge/Bug%20Bounty-Friendly-orange" alt="Bug Bounty Friendly">

  <!-- Stars -->
  <a href="https://github.com/bscript/rep/stargazers">
    <img src="https://img.shields.io/github/stars/bscript/rep?style=social" alt="GitHub Stars">
  </a>

   <!-- Discord -->
  <a href="https://discord.gg/D25vDTXFUP">
        <img src="https://img.shields.io/discord/1442955541293961429.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2" alt="Discord">
  </a>

  <!-- Sponsor -->
  <a href="https://github.com/sponsors/bscript">
    <img src="https://img.shields.io/badge/Sponsor-%F0%9F%92%96-ea4aaa?style=flat-square" alt="Sponsor">
  </a>
</p>

# :fox_face: rep+

rep+ is a lightweight Firefox DevTools extension inspired by Burp Suite's Repeater, now supercharged with AI. I often need to poke at a few requests without spinning up the full Burp stack, so I built this extension to keep my workflow fast, focused, and intelligent with integrated LLM support.

<img width="1713" height="986" alt="Screenshot 2025-12-26 at 15 35 43" src="https://github.com/user-attachments/assets/31015b99-b1d0-4a8e-8f4d-0db3e43af59b" />

[![Watch Demo](https://img.shields.io/badge/Demo-Video-red?style=for-the-badge&logo=youtube)](https://video.twimg.com/amplify_video/1992382891196571648/pl/zE5-oOXgVua1ZBQn.m3u8?tag=14)

## 🚀 Install rep+ Extension

### Firefox
🦊 **Now Available!** Clone and load manually (see [Installation](#installation) below).

> **Note:** This Firefox port includes all features from the Chrome version, plus Auth Analyzer improvements.


## Table of Contents
- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Permissions & Privacy](#permissions--privacy)
- [Limitations](#-limitations)
- [Star History](#star-history)
- [Found a Bug or Issue?](#found-a-bug-or-issue)
- [❤️ Support the Project](#️-support-the-project)

## Features

### Capture & Replay
- No proxy setup; works directly in Chrome (no CA certs needed).
- Capture every HTTP request and replay with modified method, headers, or body.
- Multi-tab capture (optional permission) with visual indicators 🌍 and deduplication.
- Clear workspace quickly; export/import requests as JSON for sharing or later reuse.

### Organization & Filtering
- Hierarchical grouping by page and domain (first-party prioritized).
- Third-party detection and collapsible groups; domain badges for quick context.
- Starring for requests, pages, and domains (auto-star for new matches).
- Timeline view (flat, chronological) to see what loaded before a request.
- Filters: method, domain, color tags, text search, regex mode.
- **Global Static Filter**: Toggle in "More Menu" to hide static files (images, JS, CSS) from the main list.
- **Resizable Panels**: Main sidebar and Auth Analyzer panel can be resized by dragging the edge.
- **Vertical Comparison**: Auth Analyzer results show Original vs Swapped responses stacked vertically for better readability.

### Views & Editing
- Pretty / Raw / Hex views; layout toggle (horizontal/vertical).
- Converters: Base64, URL encode/decode, JWT decode, Hex/UTF-8.
- History, undo/redo, and syntax highlighting for requests/responses.
- Context menu helpers on the request editor:
  - Convert selected text (Base64, URL encode/decode, JWT decode).
  - **Copy as** full HTTP request in multiple languages: `curl`, PowerShell (`Invoke-WebRequest`), Python (`requests`), and JavaScript `fetch`.
- Screenshot editor for request/response pairs: full-content capture, side‑by‑side or stacked layout, zoom, highlight and black-box redaction, resizable/movable annotations, keyboard delete, and undo/redo for all edits.

### Bulk & Automation
- Bulk replay with 4 attack modes: Sniper, Battering Ram, Pitchfork, Cluster Bomb.
- Mark positions with `§`, configure payloads, pause/resume long runs.
- Response diff view to spot changes between baseline and attempts.

### 🔐 Auth Analyzer (Firefox Enhanced)
Comprehensive authentication and authorization testing toolkit inspired by Burp Suite's Auth Analyzer extension.

#### Key Features
- **Automatic Cookie Swapping**: Replay requests with different session tokens to detect authorization bypasses
- **Real-time Analysis**: Automatically analyze all captured requests (optional with domain scope filtering)
- **Manual Testing**: "Test Auth" button for on-demand single request analysis
- **Response Comparison Engine**:
  - **SAME** (🔴 Bypass): Identical responses indicate potential authorization bypass
  - **SIMILAR** (🟡 Warning): Same status code but slightly different content (90-98% similar)
  - **DIFFERENT** (🟢 Secure): Properly denied access
- **Smart Normalization**: Removes dynamic content (timestamps, CSRF tokens, script tags) for accurate comparison
- **Token Similarity Algorithm**: Uses Jaccard index on word tokens for content-aware comparison
- **Bulk Replay**: Analyze all captured requests against a different session in one click
- **Session Management**: Import/export session configurations
- **Filtering Options**: Scope restriction by domain/URL pattern
- **Static File Exclusion**: Automatically skip CSS, JS, images, and other static resources

#### Workflow
1. Configure victim/test session cookie in Auth Analyzer settings
2. Browse application with privileged account (original session)
3. Auth Analyzer replays each request with the victim cookie
4. Results panel shows color-coded analysis:
   - 🔴 **SAME**: Critical! Unauthorized access granted (potential bypass)
   - 🟡 **SIMILAR**: Warning! Nearly identical response (investigate further)
   - 🟢 **DIFFERENT**: Secure! Access properly denied

#### Use Cases
- **Privilege Escalation Testing**: Test if low-privilege users can access admin endpoints
- **Horizontal Privilege Escalation**: Test cross-user data access (IDOR)
- **Session Testing**: Verify endpoints properly check authorization
- **Bug Bounty Automation**: Bulk test applications for authorization flaws

#### Comparison Engine
Our Firefox implementation uses an **advanced content-aware comparison** approach:
- **Normalization**: Removes `<script>`, `<style>`, hidden inputs, timestamps before comparison
- **Similarity Metric**: Jaccard index (token overlap) instead of byte-level comparison
- **Advantages over Burp's Auth Analyzer**:
  - More resilient to dynamic content (timestamps, session IDs, CSRF tokens)
  - Fewer false positives on modern SPAs and dynamic web applications
  - Configurable similarity thresholds (98% for SAME, 90% for SIMILAR)

See [Auth Analyzer Documentation](#auth-analyzer-setup) for detailed setup and usage.

### Extractors & Search
- Unified Extractor: secrets, endpoints, and parameters from captured JS.
- **Secret Scanner**: entropy + patterns with confidence scores; pagination and domain filter.
  - Powered by [Kingfisher](https://github.com/mongodb/kingfisher) rules for comprehensive secret detection
  - Supports AWS, GitHub, Google, Slack, Stripe, Twilio, Azure, and many more service providers
  - Rules stored locally in `rules/` directory for offline use
  - **Note**: Secret scanning only analyzes JavaScript files from the **current inspected tab**.
  - **Export**: Export all secrets to CSV for analysis and reporting
- **Endpoint Extractor**: full URLs, relative paths, GraphQL; method detection; one-click copy (rebuilds base URL).
  - **Export**: Export all endpoints to CSV with method, endpoint path, confidence, and source file
- **Parameter Extractor**: passive JavaScript parameter discovery with intelligent grouping and risk assessment.
  - **Parameter Types**: Extracts query, body, header, and path parameters from JavaScript files
  - **Grouped by Endpoint**: Parameters are organized by endpoint with expandable/collapsible groups
  - **Risk Classification**: Automatically identifies high-risk parameters (auth, admin, debug flags, IDOR, feature flags)
  - **Confidence Scoring**: Stricter confidence model than endpoints to reduce false positives
  - **Smart Filtering**: Suppresses common false positives (webpack, React, jQuery, DOM events, telemetry)
  - **Copy as cURL**: One-click copy generates curl commands with all parameters properly formatted
  - **Location Badges**: Visual indicators for parameter location (query/body/header/path)
  - **Domain Filtering**: Filter parameters by source domain with accurate counts
  - **Column Sorting**: Sort by parameter name, location, endpoint, method, risk level, or confidence
  - **Export Options**:
    - **CSV Export**: Export all parameters with location, endpoint, method, risk level, and confidence
    - **Postman Collection Export**: Generate ready-to-import Postman collection JSON with all endpoints and parameters
      - Automatically groups parameters by endpoint
      - Includes query, body, and header parameters
      - Uses Postman variable syntax (`{{paramName}}`) for easy testing
      - Perfect for security testers who want to quickly import discovered APIs into Postman
- **Response Search**: regex support, match preview, pagination, domain filter.

### AI Assistance

#### Rep+ AI Assistance (Interactive LLM Chat)
- **Interactive Chat Interface**: Real-time conversation with AI about your HTTP requests and responses
  - Streaming responses with live markdown rendering
  - Syntax highlighting for code blocks (supports multiple languages)
  - Copy-to-clipboard for code blocks with visual feedback
  - Token usage counter with color-coded warnings
- **Per-Request Chat History**: Each request maintains its own conversation history
  - Automatically saves chat when switching between requests
  - Restores previous conversations when returning to a request
  - Clear chat button resets only the current request's conversation
- **Cross-Reference Previous Requests**: Reference investigations from other requests
  - "Reference previous requests" UI with collapsible/expandable list
  - Select which previous requests to include in context
  - AI receives summaries of previous investigations for referenced requests
  - Perfect for multi-step testing scenarios (e.g., login → authenticated request)
- **Request Modification**: AI can modify requests directly in the editor
  - "Apply modifications" button appears when AI suggests changes
  - Smart detection: only shows when modifications are actually suggested
  - Preserves request structure (headers, formatting, HTTP version)
  - Animated application with visual feedback
  - Supports header updates, body modifications, and new header additions
- **Response History Tracking**: Tracks multiple responses from resends
  - Maintains chronological history of all responses (original + resends)
  - AI has context on all responses when analyzing changes
  - Conditional inclusion: only includes full history when relevant (token optimization)
- **Smart Context Management**: Intelligent token optimization
  - Response truncation for large responses (~1,500 tokens max)
  - Chat history compression (summarizes older messages)
  - Conditional response inclusion (only when asked about)
  - Limits response history to last 2-3 responses
  - Keeps last 15 messages in conversation history
- **Multi-Provider Support**: Works with Claude, Gemini, and local Ollama models
  - Automatic model detection for Anthropic and Gemini APIs
  - Manual URL/model configuration for local models
  - Streaming support for all providers
- **Use Cases**:
  - Security testing and penetration testing guidance
  - Request/response explanation and debugging
  - Automated request modification for testing
  - Bug bounty report generation
  - Vulnerability identification and attack vector suggestions
  - Multi-step attack chain planning with cross-request context

#### Other AI Features
- **Explain Request** (Claude/Gemini) with streaming responses.
- **Suggest Attack Vectors**: request + response analysis; auto-send if no response; payload suggestions; reflections/errors/multi-step chains; fallback to request-only with warning.
- **Context menu "Explain with AI"** for selected text.
- **Attack Surface Analysis** per domain: categorization (Auth/Payments/Admin/etc.), color-coded icons, toggle between list and attack-surface view.
- **Export AI outputs** as Markdown or PDF to save RPD/TPM.

### Productivity & Theming
- **7 Beautiful Themes**: Choose from a variety of modern, carefully crafted themes:
  - 🌙 **Dark (Default)**: Classic dark theme optimized for long sessions
  - ☀️ **Light**: Clean light theme for bright environments
  - 🎨 **Modern Dark**: VS Code Dark+ inspired theme with enhanced contrast
  - ✨ **Modern Light**: GitHub-style light theme with crisp colors
  - 💙 **Blue**: Cool blue/cyan color scheme for a fresh look
  - 🔆 **High Contrast**: Accessibility-focused theme with maximum contrast
  - 🖥️ **Terminal**: Green-on-black terminal aesthetic for retro vibes
- **Theme Selector**: Easy dropdown menu to switch themes instantly
- **Smooth Transitions**: Animated theme switching for a polished experience
- **Optimized Syntax Highlighting**: All themes include carefully tuned colors for:
  - HTTP methods, paths, headers, and versions
  - JSON keys, strings, numbers, booleans, and null values
  - Parameters and cookies
  - Request method badges (GET, POST, PUT, DELETE, PATCH)
- **Theme Persistence**: Your theme preference is saved and restored automatically
- Request color tags and filters.
- Syntax highlighting for JSON/XML/HTML.

## Quick Start
1) Open Chrome DevTools → “rep+” tab.  
2) Browse: requests auto-capture.  
3) Click a request: see raw request/response immediately.  
4) Edit and “Send” to replay; use AI buttons for explain/attack suggestions.  
5) Use timeline, filters, and bulk replay for deeper testing.

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/bscript/rep.git
   cd rep-firefox
   ```
2. **Open Firefox Debugging**:
   - Navigate to `about:debugging` in your browser.
   - Click **This Firefox** in the left sidebar.
3. **Load the Extension**:
   - Click **Load Temporary Add-on...**.
   - Navigate to the `rep` folder you just cloned.
   - Select the `manifest.json` file.
4. **Open DevTools**:
   - Press `F12` or right-click -> Inspect.
   - Look for the **rep+** tab (you might need to click the `>>` overflow menu).
5. **Grant Permissions** (if needed):
   - If you see permission errors, go to `about:addons`.
   - Find **rep+** in the list.
   - Click the gear icon → **Manage**.
   - Enable the **webRequest** permission and **Access your data for all web sites** if prompted.

This combo makes rep+ handy for bug bounty hunters and vulnerability researchers who want Burp-like iteration without the heavyweight UI. Install the extension, open DevTools, head to the rep+ panel, and start hacking. 😎

### Making the Extension Permanent (for Developers)

The "Temporary Add-on" method requires reloading the extension every time you restart Firefox. To make it persistent:

#### Option A: Firefox Developer Edition / Nightly (Recommended)
1. Use **Firefox Developer Edition** or **Nightly**.
2. Go to `about:config` in the address bar.
3. Search for `xpinstall.signatures.required`.
4. Toggle it to **false**.
5. Zip the `rep-firefox` folder contents (select all files -> compress).
6. Rename the `.zip` file to `rep-plus.xpi`.
7. Go to `about:addons` -> Gear Icon -> **Install Add-on From File...**.
8. Select your `rep-plus.xpi`.

#### Option B: Standard Firefox (Self-Signing)
If you use standard Firefox, you must sign the extension:
1. Zip the extension files.
2. Go to the [Mozilla Developer Hub](https://addons.mozilla.org/en-US/developers/).
3. Login and select **"Submit a New Add-on"**.
4. Choose **"On your own"** (Self-distribution) when asked how you want to distribute.
5. Upload your zip file.
6. Once the automated review passes (usually seconds), download the signed `.xpi` file.
7. Install this signed file in your regular Firefox browser.

### Local Model (Ollama) Setup
If you use a local model (e.g., Ollama) you must allow Firefox extensions to call it, otherwise you'll see 403/CORS errors.

1. Stop any running Ollama instance.
2. Start Ollama with CORS enabled (pick one):
   - Allow only Firefox extensions:
     ```bash
     OLLAMA_ORIGINS="moz-extension://*" ollama serve
     ```
   - Allow everything (easier for local dev):
     ```bash
     OLLAMA_ORIGINS="*" ollama serve
     ```
3. Verify your model exists (e.g., `gemma3:4b`) with `ollama list`.
4. Reload the extension and try again. If you still see 403, check Ollama logs for details.


## Auth Analyzer Setup

### Quick Start
1. **Click the 🔒 Lock icon** in the sidebar to open Auth Analyzer Results panel
2. **Click the ⚙️ Settings icon** in the results panel header to configure
3. **Enter victim/test session cookie** (e.g., `session=abc123; role=user`)
   - You can paste the entire `Cookie:` header line - it will be auto-sanitized
   - Or just the cookie value
4. **Enable Realtime Analysis** (optional):
   - Toggle ON to automatically analyze all requests
   - Add scope filter (e.g., `api.example.com`) to limit analysis to specific domains
5. **Click "Save & Enable"**

### Testing Methods

#### Manual Testing (Recommended for Precision)
1. Select a request in the main list
2. Click **"Test Auth"** button (next to Send button)
3. Request is replayed with your test session
4. Results appear in Auth Analyzer panel

#### Automatic Testing (High Coverage)
1. Enable "Realtime Analysis" in settings
2. Browse the application normally with your privileged account
3. Auth Analyzer automatically tests each request with the victim session
4. Review results in real-time

#### Bulk Testing (Retroactive)
1. Capture requests normally (browse the app)
2. Open Auth Analyzer Settings
3. Scroll to "Bulk Replay" section
4. Enter target domains (comma-separated, optional)
5. Click **"Run Bulk Replay"**
6. All matching requests are tested against the victim session

### Reading Results
- **🔴 SAME**: Response identical to original → **Potential Authorization Bypass!**
  - Same status code (e.g., 200 OK)
  - Same response body (after normalization)
  - **Action**: Investigate immediately - likely unauthorized access
- **🟡 SIMILAR**: Response very similar (90-98%) → **Warning**
  - Same status code
  - Slight content differences (may be timestamps, dynamic IDs)
  - **Action**: Manual review recommended
- **🟢 DIFFERENT**: Response differs → **Properly Secured**
  - Different status code (e.g., 403 vs 200) OR
  - Significantly different body content
  - **Action**: Authorization working correctly

### Tips
- **Clear Cookie Headers**: The tool automatically removes existing cookie headers before swapping to avoid conflicts
- **Static Files**: Use the "Filter Static Files" checkbox in Auth Analyzer Config OR the global toggle in the "More Menu" to ignore static resources
- **Scope**: Use realtime scope filtering to focus on specific API endpoints or subdomains
- **Export Results**: Results are stored per session - you can export via Storage API

## Permissions & Privacy
- **Optional**: `webRequest` + `<all_urls>` only when you enable multi-tab capture.  
- **Data**: Stored locally; no tracking/analytics.  
- **AI**: Your API keys stay local; request/response content is sent only to the provider you choose (Claude/Gemini) when you invoke AI features.


## ⚠️ Limitations

rep+ runs inside Firefox DevTools, so:

- No raw HTTP/1 or malformed requests (fetch() limitation)
- Some headers can’t be overridden (browser sandbox)
- No raw TCP sockets (no smuggling/pipelining tests)
- DevTools panel constraints limit certain UI setups

rep+ is best for quick testing, replaying, and experimenting — not full low-level HTTP work.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=bscript/rep&type=date)](https://www.star-history.com/#bscript/rep&type=date)


## Found a Bug or Issue?

If you encounter any bugs, unexpected behavior, or have feature requests, please help me improve **rep+** by [opening an issue here](https://github.com/bscript/rep/issues).  
I’ll do my best to address it as quickly as possible! 🙏

## ❤️ Support the Project

I maintain **rep+** alone, in my free time.  
Sponsorship helps me keep improving the extension, adding new features, and responding to issues quickly.

If **rep+ saved you time** during testing, development, or bug bounty work, please consider supporting the project.  
**Every dollar helps. ❤️**

## Contributors 🤝

<a href="https://github.com/bscript/rep/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bscript/rep" alt="Contributors" />
</a>

---

<h3 align="center">Sponsors</h3>
<p align="center">
  <a href="https://github.com/projectdiscovery">
    <img src="https://avatars.githubusercontent.com/u/50994705?s=60" width="60" style="border-radius:50%;" alt="Sponsor"/>
  </a>
  &nbsp;&nbsp;
  <a href="https://github.com/Snownin9">
    <img src="https://avatars.githubusercontent.com/u/218675317?s=60" width="60" style="border-radius:50%;" alt="Sponsor"/>
  </a>
  &nbsp;&nbsp;
  <a href="https://github.com/exxoticx">
    <img src="https://avatars.githubusercontent.com/u/50809037?s=60" width="60" style="border-radius:50%;" alt="Sponsor"/>
  </a>
  &nbsp;&nbsp;
  <a href="https://github.com/eduquintanilha">
    <img src="https://avatars.githubusercontent.com/u/14018253?s=60" width="60" style="border-radius:50%;" alt="Sponsor"/>
  </a>
  &nbsp;&nbsp;
   <a href="https://github.com/Snownull">
    <img src="https://avatars.githubusercontent.com/u/190537179?s=60" width="60" style="border-radius:50%;" alt="Sponsor"/>
  </a>
   &nbsp;&nbsp;
   <a href="https://github.com/assem-ch">
    <img src="https://avatars.githubusercontent.com/u/315228?s=60" width="60" style="border-radius:50%;" alt="Sponsor"/>
  </a>
   &nbsp;&nbsp;
   <a href="https://github.com/MrTurvey">
    <img src="https://avatars.githubusercontent.com/u/5578593?s=60" width="60" style="border-radius:50%;" alt="Sponsor"/>
  </a>
   &nbsp;&nbsp;
   <a href="https://github.com/greenat92">
    <img src="https://avatars.githubusercontent.com/u/8342706?s=60" width="60" style="border-radius:50%;" alt="Sponsor"/>
  </a>
   &nbsp;&nbsp;
   <a href="https://github.com/tixxdz">
    <img src="https://avatars.githubusercontent.com/u/1549291?s=60" width="60" style="border-radius:50%;" alt="Sponsor"/>
  </a>
</p>

<p align="center">
  <a href="https://github.com/sponsors/bscript">
    <img src="https://img.shields.io/badge/Become%20a%20Sponsor-%F0%9F%92%96-ea4aaa?style=for-the-badge" alt="Become a Sponsor"/>
  </a>
  <a href="https://github.com/user-attachments/assets/8e6933b5-8579-480b-99cf-161a392b4153">
    <img src="https://img.shields.io/badge/Bitcoin%20Sponsor-₿-f7931a?style=for-the-badge&logo=bitcoin&logoColor=white" alt="Bitcoin Sponsor"/>
  </a>
</p>
