import { Link } from "react-router-dom";
import { useProfileReview } from "@/hooks/useProfileReview";
import { signupChecklist } from "@/lib/signup-checklist";

export function SignupChecklist() {
  const review = useProfileReview();
  const items = signupChecklist(review.data?.profile, review.data?.role, review.data?.verification);
  if (!review.identity) return null;
  return <section aria-label="Signup checklist" className="rounded-xl border border-current/20 p-4 my-4">
    <h2 className="text-lg font-semibold">Signup checklist</h2>
    {review.loading ? <p role="status">Loading your profile…</p> : review.isError ? <p role="alert">Couldn't load your checklist. <button onClick={() => review.refetch()}>Try again</button></p> : <>
      <p className="text-sm my-3">{items.filter(i => i.done).length} of {items.length} complete. Profile completion does not replace admin approval.</p>
      <ul className="space-y-2">{items.map(i => <li key={i.id}>
        {i.done ? <span>✓ {i.title}</span> : <Link className="underline" to={i.to}>{i.title}</Link>}
        {i.note && <small className="block opacity-70">{i.note}</small>}
      </li>)}</ul>
    </>}
  </section>;
}

export function ProfileReviewGate({ children }: { children: React.ReactNode }) {
  const review = useProfileReview();
  const checklistDone = signupChecklist(review.data?.profile, review.data?.role, review.data?.verification).every(i => i.done);
  if (review.loading) return <p role="status" className="p-6">Checking profile approval…</p>;
  if (review.approved) return <>{children}</>;
  return <section className="p-6" aria-labelledby="review-title">
    <h1 id="review-title" className="text-2xl font-semibold">{review.identity ? "Profile under review" : "Sign in to browse profiles"}</h1>
    {review.isError ? <p role="alert">Couldn't check approval. <button className="underline" onClick={() => review.refetch()}>Try again</button></p> : <p className="my-4">{review.identity ? "Your profile is under review. Please check back later." : "Profile browsing is available after admin approval."}</p>}
    {!(review.identity && checklistDone) && <Link className="underline" to={review.identity ? "/me" : "/auth"}>{review.identity ? "Complete your signup checklist" : "Sign in"}</Link>}
    {review.identity && <SignupChecklist />}
  </section>;
}
