import { Checkbox } from "@/components/ui/checkbox";
import { Shield } from "lucide-react";

interface LegalDisclaimerProps {
  agreed: boolean;
  onAgreeChange: (agreed: boolean) => void;
}

const LegalDisclaimer = ({ agreed, onAgreeChange }: LegalDisclaimerProps) => {
  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center gap-2 text-primary">
        <Shield className="w-5 h-5" />
        <h3 className="font-semibold">Legal Disclaimer & Terms of Use</h3>
      </div>
      
      <div className="text-sm text-muted-foreground space-y-3 max-h-48 overflow-y-auto pr-2">
        <p>
          <strong>Legal Disclaimer:</strong> Catalyst Intro, to the fullest extent of the law, 
          is not responsible for the outcome of any relationships or interpersonal communications 
          made on the platform. Catalyst Intro executes background checks on users to develop a 
          standard of trust, but this does not eliminate the need for any due diligence on a user's part.
        </p>
        <p>
          Catalyst Intro is a public-facing discovery platform. Represent your company and yourself 
          in the best way possible at all times. Users must be over the age of 18 to use the application.
        </p>
      </div>
      
      <div className="flex items-start space-x-3 pt-2 border-t">
        <Checkbox
          id="legal-agreement"
          checked={agreed}
          onCheckedChange={(checked) => onAgreeChange(checked === true)}
          className="mt-0.5"
        />
        <label
          htmlFor="legal-agreement"
          className="text-sm cursor-pointer leading-relaxed"
        >
          I am over 18 years of age and I agree to the Legal Disclaimer and Terms of Use.
        </label>
      </div>
    </div>
  );
};

export default LegalDisclaimer;
