import { useEffect } from "react";

const CatalystDeck = () => {
  useEffect(() => {
    document.title = "Catalyst — Pre-Seed Deck";
  }, []);

  return (
    <iframe
      src={`/catalystdeck.html?v=${Date.now()}`}
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
