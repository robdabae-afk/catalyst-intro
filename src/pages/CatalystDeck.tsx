import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const CatalystDeck = () => {
  const [params] = useSearchParams();
  const edit = params.get("edit") === "1";

  useEffect(() => {
    document.title = edit ? "Catalyst Deck — Editing" : "Catalyst — Pre-Seed Deck";
  }, [edit]);

  const src = edit ? "/catalystdeck.html?edit=1" : "/catalystdeck.html";

  return (
    <iframe
      src={src}
      title="Catalyst Pre-Seed Deck"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: "none",
        background: "#000",
      }}
    />
  );
};

export default CatalystDeck;
