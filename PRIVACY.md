# Privacy Policy for rep+

**Last Updated**: 2025

## Overview

rep+ is a Firefox DevTools extension that helps developers and security researchers capture, modify, and replay HTTP requests. This privacy policy explains how we handle your data.

## Data Collection

### What We Collect

**We do NOT collect any personal data or browsing information.**

rep+ operates entirely locally in your browser. All data is stored locally using Firefox's `localStorage` API and is never transmitted to external servers (except as described below for AI features).

### Local Storage

The following data is stored locally on your device:

- **Captured HTTP Requests**: Stored in memory only, cleared when you close DevTools
- **User Preferences**: Theme preference, dismissed banners
- **AI API Keys** (Optional): If you choose to use AI features, your API keys are stored locally in `localStorage`
- **Export Data**: Any exported request data is stored locally if you choose to save it

### What We DON'T Collect

- ❌ No browsing history
- ❌ No personal information
- ❌ No analytics or tracking
- ❌ No telemetry data
- ❌ No usage statistics
- ❌ No data sent to our servers

## Third-Party Services

### AI Features (Optional)

If you choose to use the AI-powered features (Request Explanation, Attack Vector Suggestions), rep+ uses third-party AI services:

- **Anthropic Claude API**: When you use Claude for explanations
- **Google Gemini API**: When you use Gemini for explanations

**Important Notes:**
- You must provide your own API keys (stored locally in your browser)
- Your API keys are never shared with us
- Request/response data is sent directly to the AI provider you choose
- We have no access to this data
- Please review Anthropic's and Google's privacy policies for how they handle your data

### Required Permissions

rep+ requires the following permissions for its core functionality:

- **`webRequest` + `<all_urls>`**: Required for the extension's primary purpose as a network request analysis tool

**Why `<all_urls>` is necessary:**

1. **Network Request Capture**: rep+ is a DevTools extension designed for security testing and network analysis. It must be able to capture HTTP/HTTPS requests from any website the user is testing, which requires access to all URLs.

2. **Multi-Tab Capture**: The extension captures network requests across all browser tabs simultaneously, enabling security researchers to monitor activity across multiple sites or test scenarios.

3. **Request Replay**: Users need to replay captured requests to any domain (including cross-origin) for security testing, bug bounty hunting, and penetration testing. Without `<all_urls>`, the extension could only replay to the same origin, severely limiting functionality.

4. **Security Testing Use Case**: As a security testing tool, rep+ must interact with any website the user is testing. Domain-specific permissions would prevent testing new targets without reconfiguration.

**Permission Model:**
- These permissions are declared in the extension manifest and granted at installation time
- In Firefox MV3, permissions cannot be dynamically requested or revoked after installation
- All captured data remains local in the browser - no network data is transmitted to external servers (except when you explicitly use AI features)

## Data Security

- All data is stored locally in your browser
- No data is transmitted to external servers (except AI API calls you initiate)
- API keys are stored in browser localStorage (encrypted by Firefox)
- You can clear all data by clearing browser storage or uninstalling the extension

## Your Rights

- **Access**: All data is stored locally - you can access it through Firefox DevTools
- **Deletion**: Clear browser storage or uninstall the extension to delete all data
- **Control**: Permissions are granted at installation time in Firefox

## Changes to This Policy

We may update this privacy policy. The "Last Updated" date at the top indicates when changes were made.

## Contact

For questions about this privacy policy, please open an issue on [GitHub](https://github.com/bscript/rep/issues).

## Open Source

rep+ is open source. You can review the code to verify our privacy claims:
- [GitHub Repository](https://github.com/bscript/rep)

