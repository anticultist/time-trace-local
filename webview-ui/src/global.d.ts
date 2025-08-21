// VSCode Elements TypeScript declarations for React 19 web components
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "vscode-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          appearance?: "primary" | "secondary" | "outline" | "transparent";
          disabled?: boolean;
          icon?: string;
          "icon-after"?: string;
          "icon-only"?: boolean;
          secondary?: boolean;
          autofocus?: boolean;
          type?: "button" | "submit" | "reset";
          // React 19 style custom event handlers
          onvscClick?: (event: CustomEvent) => void;
          "onvsc-click"?: (event: CustomEvent) => void;
        },
        HTMLElement
      >;

      "vscode-button-group": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;

      "vscode-badge": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          appearance?: "default" | "counter";
        },
        HTMLElement
      >;

      "vscode-checkbox": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          checked?: boolean;
          disabled?: boolean;
          readonly?: boolean;
          indeterminate?: boolean;
        },
        HTMLElement
      >;

      "vscode-textfield": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          disabled?: boolean;
          readonly?: boolean;
          placeholder?: string;
          value?: string;
          type?: "text" | "password" | "email" | "number";
        },
        HTMLElement
      >;

      "vscode-textarea": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          disabled?: boolean;
          readonly?: boolean;
          placeholder?: string;
          value?: string;
          rows?: number;
          cols?: number;
        },
        HTMLElement
      >;
    }
  }
}
