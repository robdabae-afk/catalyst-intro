import { FormEvent, ReactNode, useState } from "react";
import { Check, Send } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import ExitFundLayout, { usePageMeta } from "./ExitFundLayout";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(100),
  email: z.string().trim().email("Please enter a valid email address.").max(255),
  company: z.string().trim().min(1, "Please enter your company or project.").max(150),
  inquiryType: z.enum(["partnership", "media", "ecosystem", "other"]),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters.")
    .max(2000, "Please keep your message under 2000 characters."),
});

export default function ExitFundContact() {
  usePageMeta(
    "Contact — The Exit Fund",
    "Contact The Exit Fund about partnerships, media, and ecosystem opportunities.",
  );

  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setMessage("");

    const parsed = contactSchema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      company: form.get("company"),
      inquiryType: form.get("inquiryType"),
      message: form.get("message"),
    });

    if (!parsed.success) {
      setStatus("error");
      setMessage(parsed.error.issues[0]?.message ?? "Please review the form.");
      return;
    }

    setStatus("sending");
    const { error } = await supabase.from("contact_submissions").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company,
      inquiry_type: parsed.data.inquiryType,
      message: parsed.data.message,
    });

    if (error) {
      setStatus("error");
      setMessage("We couldn't send your message. Please try again.");
      return;
    }

    formElement.reset();
    setStatus("success");
  }

  return (
    <ExitFundLayout>
      <section className="ef-container grid gap-12 py-16 sm:py-24 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="ef-eyebrow">Contact</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
            Start a conversation.
          </h1>
          <p className="mt-7 max-w-md text-lg leading-8 text-[var(--ef-muted)]">
            For partnerships, media, ecosystem opportunities, and other fund-related inquiries.
          </p>
          <div className="mt-10 border-l-2 border-[var(--ef-primary)] pl-5 text-sm leading-6 text-[var(--ef-muted)]">
            Founder applications belong on Catalyst, not this form.
          </div>
          <p className="mt-10 text-sm font-bold">Public email forthcoming</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 border-t border-[var(--ef-border)] pt-8"
          noValidate
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" htmlFor="name">
              <input id="name" name="name" required maxLength={100} autoComplete="name" />
            </Field>
            <Field label="Email" htmlFor="email">
              <input
                id="email"
                name="email"
                type="email"
                required
                maxLength={255}
                autoComplete="email"
              />
            </Field>
          </div>
          <Field label="Company or project" htmlFor="company">
            <input
              id="company"
              name="company"
              required
              maxLength={150}
              autoComplete="organization"
            />
          </Field>
          <Field label="Inquiry type" htmlFor="inquiryType">
            <select id="inquiryType" name="inquiryType" required defaultValue="partnership">
              <option value="partnership">Partnership</option>
              <option value="media">Media</option>
              <option value="ecosystem">Ecosystem</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Message" htmlFor="message">
            <textarea id="message" name="message" required maxLength={2000} className="min-h-40" />
          </Field>
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="ef-btn" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Send inquiry"} <Send className="size-4" />
            </button>
            {status === "success" && (
              <p
                role="status"
                className="inline-flex items-center gap-2 text-sm font-bold text-[var(--ef-primary)]"
              >
                <Check className="size-4" /> Message received.
              </p>
            )}
            {status === "error" && (
              <p role="alert" className="text-sm font-semibold text-[#B42318]">
                {message}
              </p>
            )}
          </div>
        </form>
      </section>
    </ExitFundLayout>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}
