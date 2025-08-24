// Import the VSCode Elements React wrapper components
import { VscodeButton } from "@vscode-elements/react-elements";
import { useState } from "react";
import type { VsCodeApi } from "./types/vscode";

interface AppProps {
  readonly vscode: VsCodeApi;
}

export function App({ vscode }: AppProps) {
  const [clickCount, setClickCount] = useState(0);

  const handleButtonClick = (event: any) => {
    console.log("VSCode button clicked!", event);

    // Use the VS Code API passed as prop to send a message to the extension
    vscode.postMessage({
      type: "showInfo",
      text: "VSCode Elements button is working!",
    });
  };

  const handleCounterClick = () => {
    console.log("Counter button clicked! Current count:", clickCount);
    setClickCount((prevCount) => prevCount + 1);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "var(--vscode-font-family)" }}>
      <h1>VSCode Elements React Integration Test</h1>
      <p>
        Testing VSCode Elements integration with React 19 using React wrapper
        components.
      </p>

      <div style={{ marginBottom: "20px" }}>
        <h3>Primary Button</h3>
        <VscodeButton onClick={handleButtonClick}>Click me!</VscodeButton>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Secondary Button</h3>
        <VscodeButton secondary onClick={handleButtonClick}>
          Secondary Action
        </VscodeButton>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Disabled Button</h3>
        <VscodeButton disabled>Can't click me</VscodeButton>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Button with Icon</h3>
        <VscodeButton icon="add" onClick={handleButtonClick}>
          Add Item
        </VscodeButton>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Icon-only Button</h3>
        <VscodeButton
          icon="save"
          iconOnly
          onClick={handleButtonClick}
          title="Save"
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Click Counter Button</h3>
        <VscodeButton onClick={handleCounterClick}>
          {clickCount} times clicked
        </VscodeButton>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Different Button Appearances</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <VscodeButton onClick={handleButtonClick}>
            Primary (Default)
          </VscodeButton>
          <VscodeButton secondary onClick={handleButtonClick}>
            Secondary
          </VscodeButton>
          <VscodeButton onClick={handleButtonClick}>Standard</VscodeButton>
        </div>
      </div>

      <div
        style={{
          marginTop: "40px",
          padding: "15px",
          backgroundColor: "var(--vscode-editor-background)",
          border: "1px solid var(--vscode-panel-border)",
          borderRadius: "4px",
        }}
      >
        <h4 style={{ margin: "0 0 10px 0" }}>
          ✅ VSCode Elements React Integration Complete!
        </h4>
        <p
          style={{
            margin: "0",
            fontSize: "14px",
            color: "var(--vscode-descriptionForeground)",
          }}
        >
          VSCode Elements has been successfully integrated with React 19 using
          React wrapper components. The buttons above demonstrate different
          styles and functionality available with proper React event handling.
        </p>
      </div>
    </div>
  );
}
