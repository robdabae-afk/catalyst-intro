import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import WaitlistPreview from "./WaitlistPreview";

// Standalone public design demo. No account/signup routes or submission form.
createRoot(document.getElementById("root")!).render(
  <BrowserRouter><WaitlistPreview mock /></BrowserRouter>
);
