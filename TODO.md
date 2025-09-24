# TODO

- setup
  - extend copilot instructions
    - <https://raw.githubusercontent.com/vscode-elements/examples/refs/heads/react-vite/react-vite/src/global.d.ts>
  - <https://gist.github.com/t3dotgg/a486c4ae66d32bf17c09c73609dacc5b>
  - <https://agents.md/>
  - `vsce package` -> build webview-ui and services package!

- <https://code.visualstudio.com/api/extension-guides/webview>
- <https://code.visualstudio.com/api/extension-guides/custom-editors>
- <https://github.com/microsoft/vscode-extension-samples>
- <https://dev.to/rakshit47/create-vs-code-extension-with-react-typescript-tailwind-1ba6#react>
- <https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/frameworks/hello-world-react-vite>
- <https://www.npmjs.com/package/better-sqlite3>
- ux/ui
  - improve logo
    - <https://graphite.rs/>
  - emotionally intelligent design
    - <https://medium.com/@Precious_Nwakama/emotionally-intelligent-design-creating-products-that-adapt-to-user-mood-in-2025-4702dbe4d42a>
    - statement: what happens to your data?
  - illustrations
  - micro animation
    - [The Art of Microinteractions: Enhancing User Experience One Detail at a Time](https://artversion.com/blog/the-art-of-microinteractions-enhancing-user-experience-one-detail-at-a-time/)
  - Onboarding
    - inside the app or link to a youtube video
  - visual language (color psychology)
  - a/b testing a vs code extension
  - survey
  - [Few Guesses, More Success: 4 Principles to Reduce Cognitive Load in Forms](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/)
  - onboarding
  - paywall
    - <https://superwall.com/templates>
    - <https://www.paywallscreens.com/>

- possible features
  - search
  - overtime display (max warning e.g. more than 40h)
  - no breaks
  - custom overview/summery (e.g. last two weeks for a retro)
  - export (e.g. as brag document)
  - calender view
- further reading
  - <https://github.com/microsoft/vscode/issues/249227>

```ts
const dbPath = vscode.Uri.joinPath(context.globalStorageUri, 'my-database.sqlite');
```

```ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  // Store a secret (encrypted)
  await context.secrets.store('apiKey', 'your-secret-api-key');
  
  // Retrieve a secret
  const apiKey = await context.secrets.get('apiKey');
  
  // Delete a secret
  await context.secrets.delete('apiKey');
  
  // Listen for secret changes
  context.secrets.onDidChange(event => {
    console.log(`Secret ${event.key} was changed`);
  });
}
```

```ts
export async function authenticate() {
  // Get existing session or create new one
  const session = await vscode.authentication.getSession('github', ['repo'], {
    createIfNone: true
  });
  
  if (session) {
    console.log('Authenticated as:', session.account.label);
    console.log('Access token:', session.accessToken);
  }
}
```
