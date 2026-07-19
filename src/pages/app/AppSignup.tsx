import React from "react";
import { useNavigate } from "react-router-dom";

export default function AppSignup() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "24px",
        background:
          "linear-gradient(0deg, var(--color-grey-7, #111111) 0%, var(--color-grey-7, #111111) 100%), var(--color-white-solid, white)",
        justifyContent: "center",
        alignItems: "flex-start",
        display: "inline-flex",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          width: "390px",
          height: "844px",
          position: "relative",
          background: "var(--color-blue-5, #0A0A0D)",
          overflow: "hidden",
          borderRadius: "40px",
        }}
      >
        {/* "I already have an account" */}
        <div
          style={{
            width: "330px",
            height: "52px",
            paddingTop: "8px",
            left: "30px",
            top: "744px",
            position: "absolute",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            display: "inline-flex",
          }}
        >
          <div
            style={{
              alignSelf: "stretch",
              height: "44px",
              justifyContent: "center",
              alignItems: "center",
              display: "inline-flex",
              cursor: "pointer",
            }}
            onClick={() => navigate("/auth")}
          >
            <div
              style={{
                textAlign: "center",
                justifyContent: "center",
                display: "flex",
                flexDirection: "column",
                color: "var(--color-grey-96, #F6F5F2)",
                fontSize: "15px",
                fontFamily: "Inter",
                fontWeight: 400,
                wordWrap: "break-word",
              }}
            >
              I already have an account
            </div>
          </div>
        </div>

        {/* Decorative blobs */}
        <div
          style={{
            width: "320px",
            height: "320px",
            left: "-30px",
            top: "120px",
            position: "absolute",
            opacity: 0.28,
            background: "var(--color-yellow-47, #C6A02C)",
            boxShadow: "10px 10px 10px",
            borderRadius: "160px",
            filter: "blur(5px)",
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
            background: "var(--color-yellow-47, #C6A02C)",
            boxShadow: "10px 10px 10px",
            borderRadius: "150px",
            filter: "blur(5px)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            width: "390px",
            left: "0px",
            top: "250px",
            position: "absolute",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: "8px",
            display: "inline-flex",
          }}
        >
          <div
            style={{
              alignSelf: "stretch",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "center",
              display: "flex",
            }}
          >
            <div
              style={{
                textAlign: "center",
                justifyContent: "center",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span
                style={{
                  color: "var(--color-grey-96, #F6F5F2)",
                  fontSize: "36px",
                  fontFamily: "Inter",
                  fontWeight: 600,
                  letterSpacing: "6.48px",
                  wordWrap: "break-word",
                }}
              >
                CAT
              </span>
              <span
                style={{
                  color: "var(--color-yellow-47, #C6A02C)",
                  fontSize: "36px",
                  fontFamily: "Inter",
                  fontWeight: 600,
                  letterSpacing: "6.48px",
                  wordWrap: "break-word",
                }}
              >
                A
              </span>
              <span
                style={{
                  color: "var(--color-grey-96, #F6F5F2)",
                  fontSize: "36px",
                  fontFamily: "Inter",
                  fontWeight: 600,
                  letterSpacing: "6.48px",
                  wordWrap: "break-word",
                }}
              >
                LYST
              </span>
            </div>
          </div>
          <div
            style={{
              alignSelf: "stretch",
              paddingTop: "4px",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "center",
              display: "flex",
            }}
          >
            <div
              style={{
                textAlign: "center",
                justifyContent: "center",
                display: "flex",
                flexDirection: "column",
                color: "var(--color-grey-96, #F6F5F2)",
                fontSize: "10px",
                fontFamily: "Inter",
                fontWeight: 400,
                textTransform: "uppercase",
                letterSpacing: "2.20px",
                wordWrap: "break-word",
              }}
            >
              Shaping the future of retail investing
            </div>
          </div>
          <div
            style={{
              width: "120px",
              height: "2px",
              background: "var(--color-yellow-47, #C6A02C)",
            }}
          />
        </div>

        {/* Tagline */}
        <div
          style={{
            width: "330px",
            paddingBottom: "14px",
            left: "30px",
            top: "491.94px",
            position: "absolute",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            display: "inline-flex",
          }}
        >
          <div
            style={{
              alignSelf: "stretch",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              display: "flex",
            }}
          >
            <div
              style={{
                alignSelf: "stretch",
                justifyContent: "center",
                display: "flex",
                flexDirection: "column",
                color: "var(--color-grey-96, #F6F5F2)",
                fontSize: "38px",
                fontFamily: "Fraunces",
                fontWeight: 600,
                lineHeight: "41px",
                wordWrap: "break-word",
              }}
            >
              Where founders
              <br />
              meet capital.
            </div>
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            width: "300px",
            maxWidth: "300px",
            paddingBottom: "30px",
            left: "30px",
            top: "588px",
            position: "absolute",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            display: "inline-flex",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "300px",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              display: "flex",
            }}
          >
            <div
              style={{
                alignSelf: "stretch",
                justifyContent: "center",
                display: "flex",
                flexDirection: "column",
                color: "var(--color-grey-56, #94908A)",
                fontSize: "15px",
                fontFamily: "Inter",
                fontWeight: 400,
                lineHeight: "24px",
                wordWrap: "break-word",
              }}
            >
              Curated intros between founders and
              <br />
              investors who actually fit. No noise, no
              <br />
              cold outreach.
            </div>
          </div>
        </div>

        {/* Create account button */}
        <div
          onClick={() => navigate("/app/signup/form")}
          style={{
            width: "330px",
            height: "54px",
            left: "30px",
            top: "690px",
            position: "absolute",
            background: "var(--color-grey-96, #F6F5F2)",
            borderRadius: "16px",
            justifyContent: "center",
            alignItems: "center",
            gap: "8.01px",
            display: "inline-flex",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              textAlign: "center",
              justifyContent: "center",
              display: "flex",
              flexDirection: "column",
              color: "var(--color-grey-4, #0A0A0C)",
              fontSize: "15px",
              fontFamily: "Inter",
              fontWeight: 500,
              wordWrap: "break-word",
            }}
          >
            Create account
          </div>
          <div
            data-variant="1"
            style={{ width: "18px", height: "18px", position: "relative", overflow: "hidden" }}
          >
            <div
              style={{
                width: "10.50px",
                height: "9px",
                left: "3.75px",
                top: "4.50px",
                position: "absolute",
                outline: "1.50px var(--color-grey-4, #0A0A0C) solid",
                outlineOffset: "-0.75px",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
