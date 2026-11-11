"use client";
// HARNESS (G6): minimal page mounting the doc's OrderSearch inside the provider + a chat.
import { CopilotChat } from "@copilotkit/react-core/v2";
import { OrderSearch } from "./OrderSearch";
export default function Page() {
  return (<div style={{ height: "100vh" }}><OrderSearch /><CopilotChat /></div>);
}
