# VS Code

## Create a vsix file

```sh
cd packages/extension
pnpx vsce package
```

## Test a vsix file

```shell
code --install-extension time-trace-local--x.y.z.vsix
```

## Preparations for a new version

- bump version in `package.json`
- update `CHANGELOG.md`
- Install and test the `vsix` file
