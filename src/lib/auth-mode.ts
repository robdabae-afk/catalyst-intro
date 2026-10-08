export type AuthMode = "signin" | "signup";
/** /auth opens in sign-in; only an explicit ?mode=signup shows the signup form. */
export const initialAuthMode = (search: string): AuthMode => new URLSearchParams(search).get("mode") === "signup" ? "signup" : "signin";
