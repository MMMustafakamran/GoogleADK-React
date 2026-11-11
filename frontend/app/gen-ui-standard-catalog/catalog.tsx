import {
  createGenerativeUI,
  standardUI,
  type GenerativeUIComponentProps,
} from "@copilotkit/react-core/v2/generative-ui";

function MyCard({ children }: GenerativeUIComponentProps<typeof standardUI, "Card">) {
  return <div className="rounded-2xl border p-6 shadow-sm">{children}</div>;
}

export const appUI = createGenerativeUI({
  id: "acme/app@1",
  extends: [standardUI],
  overrides: { Card: { component: MyCard } },
  components: {},
});

// Doc "Drop components" snippet, verbatim (renamed binding only so both snippets live in one file)
export const appUIOmit = createGenerativeUI({ // HARNESS: doc names this appUI too; renamed to avoid a duplicate export
  id: "acme/app@1",
  extends: [standardUI.omit(["Map", "Video", "HtmlView"])],
  components: {},
});
