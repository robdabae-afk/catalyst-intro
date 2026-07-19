import React from "react";
import { useNavigate } from "react-router-dom";

export default function AppSignup() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        padding: "24px",
        background: "#111111",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "390px",
          height: "844px",
          position: "relative",
          background: "#0A0A0D",
          overflow: "hidden",
          borderRadius: "40px",
          flexShrink: 0,
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            width: "320px",
            height: "320px",
            left: "-30px",
            top: "120px",
            position: "absolute",
            opacity: 0.28,
            background: "#C6A02C",
            borderRadius: "160px",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            width: "300px",
            height: "300px",
            left: "160px",
            top: "220px",
            position: "absolute",
            opacity: 0.36,
            background: "#C6A02C",
            borderRadius: "150px",
            filter: "blur(60px)",
          }}
        />

        {/* Logo block */}
        <div
          style={{
            width: "390px",
            left: 0,
            top: "250px",
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {/* CATALYST — all on one line */}
          <div
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "baseline",
            }}
          >
            <span
              style={{
                color: "#F6F5F2",
                fontSize: "36px",
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                letterSpacing: "6.48px",
              }}
            >
              CAT
            </span>
            <span
              style={{
                color: "#C6A02C",
                fontSize: "36px",
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                letterSpacing: "6.48px",
              }}
            >
              A
            </span>
            <span
              style={{
                color: "#F6F5F2",
                fontSize: "36px",
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                letterSpacing: "6.48px",
              }}
            >
              LYST
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              paddingTop: "4px",
              textAlign: "center",
              color: "#F6F5F2",
              fontSize: "10px",
              fontFamily: "Inter, sans-serif",
              fontWeight: 400,
              textTransform: "uppercase",
              letterSpacing: "2.20px",
            }}
          >
            Shaping the future of retail investing
          </div>

          {/* Gold divider */}
          <div
            style={{
              width: "120px",
              height: "2px",
              background: "#C6A02C",
            }}
          />
        </div>

        {/* Headline */}
        <div
          style={{
            width: "330px",
            left: "30px",
            top: "491px",
            position: "absolute",
            color: "#F6F5F2",
            fontSize: "38px",
            fontFamily: "Fraunces, serif",
            fontWeight: 600,
            lineHeight: "41px",
            textAlign: "center",
          }}
        >
          Where founders
          <br />
          meet capital.
        </div>

        {/* Description */}
        <div
          style={{
            width: "300px",
            left: "45px",
            top: "590px",
            position: "absolute",
            color: "#94908A",
            fontSize: "15px",
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            lineHeight: "24px",
            textAlign: "center",
          }}
        >
          Curated intros between founders and
          <br />
          investors who actually fit. No noise, no
          <br />
          cold outreach.
        </div>

        {/* Create account button */}
        <div
          onClick={() => navigate("/signup/form")}
          style={{
            width: "330px",
            height: "54px",
            left: "30px",
            top: "690px",
            position: "absolute",
            background: "#F6F5F2",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              color: "#0A0A0C",
              fontSize: "15px",
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
            }}
          >
            Create account
          </span>
          {/* Arrow icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.75 9H14.25M14.25 9L10.125 4.875M14.25 9L10.125 13.125"
              stroke="#0A0A0C"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* I already have an account */}
        <div
          onClick={() => navigate("/auth")}
          style={{
            width: "330px",
            left: "30px",
            top: "756px",
            position: "absolute",
            textAlign: "center",
            color: "#F6F5F2",
            fontSize: "15px",
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            cursor: "pointer",
          }}
        >
          I already have an account
        </div>
      </div>
    </div>
  );
}
