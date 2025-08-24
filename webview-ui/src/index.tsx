import ReactDOM from "react-dom/client";
import { App } from "./App";

const rootElement = document.getElementById("root")!;

if (!rootElement.innerHTML) {
  // Acquire VS Code API once at the top level
  const vscode = window.acquireVsCodeApi();

  const root = ReactDOM.createRoot(rootElement);
  root.render(<App vscode={vscode} />);
}
