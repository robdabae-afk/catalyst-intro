import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Pricing from "./features/screens/Pricing";
import "./features/features.css";
const query = new QueryClient();
createRoot(document.getElementById("root")!).render(<QueryClientProvider client={query}><BrowserRouter><div className="cf" style={{padding:"clamp(20px,4vw,48px)",minHeight:"100vh"}}><div className="mono" style={{marginBottom:32}}>CATALYST / MEMBERSHIP</div><Pricing preview/></div></BrowserRouter></QueryClientProvider>);
