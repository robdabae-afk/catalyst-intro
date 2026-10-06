import { useParams } from "react-router-dom";
import { Head } from "../FeaturesApp";
import { PrivacyBody, TermsBody } from "@/redesign/Pages";

/* Legal pages rendered inside the app shell so native users never leave the app. */
export default function Legal() {
  const { doc } = useParams();
  const terms = doc === "terms";
  return (
    <div className="legal">
      <Head title={terms ? "Terms of use" : "Privacy notice"} back />
      {terms ? <TermsBody app /> : <PrivacyBody app />}
    </div>
  );
}
