import { z } from "zod"; // HARNESS: the doc's After snippet uses z without importing it
import {
  createGenerativeUI,
  standardUI,
} from "@copilotkit/react-core/v2/generative-ui";

// HARNESS: Airport and Arrow renderers are never shown on the page ("Your renderers stay as they are"); minimal stubs.
function Airport({ code, city }: { code: string; city: string }) {
  return <div><b>{code}</b><div>{city}</div></div>;
}
function Arrow() {
  return <span>→</span>;
}

export const appUI = createGenerativeUI({
  id: "acme/flights@1",
  extends: [standardUI],
  components: {
    Airport: {
      component: Airport,
      description: "An airport by IATA code, with its city under it.",
      props: z.object({ code: z.string(), city: z.string() }),
    },
    Arrow: { component: Arrow, description: "An arrow between two airports." },
  },
});
