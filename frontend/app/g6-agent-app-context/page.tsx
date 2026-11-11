"use client";
// HARNESS (G6): minimal page mounting the doc's YourComponent + a chat.
import { CopilotChat } from "@copilotkit/react-core/v2";
import { YourComponent } from "./YourComponent";
export default function Page() {
  return (<div style={{ height: "100vh" }}><YourComponent /><CopilotChat /></div>);
}
