// Import the VSCode Elements web components
import "@vscode-elements/elements/dist/vscode-button";

export function App() {
  const handleButtonClick = (event: any) => {
    console.log("VSCode button clicked!", event);
    alert("VSCode Elements button is working!");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "var(--vscode-font-family)" }}>
      <h1>VSCode Elements Test</h1>
      <p>
        Testing VSCode Elements integration with React 19 using web components.
      </p>

      <div style={{ marginBottom: "20px" }}>
        <h3>Primary Button</h3>
        <vscode-button onvsc-click={handleButtonClick}>Click me!</vscode-button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Secondary Button</h3>
        <vscode-button secondary onvsc-click={handleButtonClick}>
          Secondary Action
        </vscode-button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Disabled Button</h3>
        <vscode-button disabled>Can't click me</vscode-button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Button with Icon</h3>
        <vscode-button icon="add" onvsc-click={handleButtonClick}>
          Add Item
        </vscode-button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Icon-only Button</h3>
        <vscode-button
          icon="save"
          icon-only
          onvsc-click={handleButtonClick}
          title="Save"
        ></vscode-button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Different Button Appearances</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <vscode-button onvsc-click={handleButtonClick}>
            Primary (Default)
          </vscode-button>
          <vscode-button secondary onvsc-click={handleButtonClick}>
            Secondary
          </vscode-button>
          <vscode-button onvsc-click={handleButtonClick}>
            Standard
          </vscode-button>
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
          ✅ VSCode Elements Integration Complete!
        </h4>
        <p
          style={{
            margin: "0",
            fontSize: "14px",
            color: "var(--vscode-descriptionForeground)",
          }}
        >
          VSCode Elements has been successfully integrated with React 19 using
          web components. The buttons above demonstrate different styles and
          functionality available.
        </p>
      </div>
    </div>
  );
}
