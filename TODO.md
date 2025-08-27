# TODO

- setup
  - <https://github.com/jallen-dev/vscode-react-starter>
  - improve vscode elements setup
    - <https://vscode-elements.github.io/>
    - <https://vscode-elements.github.io/elements-lite/>
  - <https://pnpm.io/workspaces>
  - extend copilot instructions
    - <https://raw.githubusercontent.com/vscode-elements/examples/refs/heads/react-vite/react-vite/src/global.d.ts>
  - <https://gist.github.com/t3dotgg/a486c4ae66d32bf17c09c73609dacc5b>

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

- possible features
  - search
  - overtime display (max warning e.g. more than 40h)
  - no breaks
- further reading
  - <https://github.com/microsoft/vscode/issues/249227>

```ts
const dbPath = vscode.Uri.joinPath(context.globalStorageUri, 'my-database.sqlite');
```

```PowerShell
$since=(Get-Date).AddDays(-1); Get-WinEvent -FilterHashtable @{LogName='System';Id=6005,6006,6008,1074,42,1;StartTime='2025-08-06T00:00:00'} | ConvertTo-Json
```
