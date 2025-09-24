# VS Code

## Create a vsix file

```sh
cd packages/extension
pnpx vsce package
```

## Test a vsix file

```shell
code --install-extension time-trace-local-x.y.z.vsix
code --install-extension time-trace-local-x.y.z.vsix --force
```

## Preparations for a new version

- bump version in `package.json`
- update `CHANGELOG.md`
- test the new version
  - Install `vsix` file
  - Open developer tools and look for errors and warnings
