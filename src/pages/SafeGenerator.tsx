import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, AlertTriangle, FileText } from "lucide-react";

const SafeGenerator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyState, setCompanyState] = useState("");
  
  const [formData, setFormData] = useState({
    investorName: "",
    amount: "",
    valuationCap: "",
    discountRate: "",
    executionDate: ""
  });

  useEffect(() => {
    // Pre-fill from query params if coming from document request
    const investorName = searchParams.get('investor_name');
    const amount = searchParams.get('amount');
    
    if (investorName || amount) {
      setFormData(prev => ({
        ...prev,
        investorName: investorName || prev.investorName,
        amount: amount || prev.amount,
      }));
    }
    
    loadCompanyInfo();
  }, [searchParams]);

  const loadCompanyInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }
    
    // Check if user is a founder
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();
    
    if (profile?.user_type !== 'founder') {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Only founders can generate SAFE templates.",
      });
      navigate('/dashboard');
      return;
    }
    
    // Load founder profile for company info
    const { data: founderProfile } = await supabase
      .from('founder_profiles')
      .select('company_name, startup_name, company_state')
      .eq('profile_id', user.id)
      .single();
    
    if (founderProfile) {
      setCompanyName(founderProfile.company_name || founderProfile.startup_name || '');
      setCompanyState(founderProfile.company_state || 'Delaware');
    }
  };

  const generateSafeDocument = () => {
    const date = formData.executionDate 
      ? new Date(formData.executionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : '[DATE]';
    
    const amount = formData.amount ? `$${parseFloat(formData.amount).toLocaleString()}` : '[AMOUNT]';
    const valuationCap = formData.valuationCap ? `$${parseFloat(formData.valuationCap).toLocaleString()}` : '[VALUATION CAP]';
    const discountRate = formData.discountRate ? `${formData.discountRate}%` : '[DISCOUNT RATE]';
    const investorName = formData.investorName || '[INVESTOR NAME]';
    const company = companyName || '[COMPANY NAME]';
    const state = companyState || '[STATE]';

    return `SAFE
(Simple Agreement for Future Equity)

THIS INSTRUMENT AND ANY SECURITIES ISSUABLE PURSUANT HERETO HAVE NOT BEEN REGISTERED UNDER THE SECURITIES ACT OF 1933, AS AMENDED (THE "SECURITIES ACT"), OR UNDER THE SECURITIES LAWS OF CERTAIN STATES. THESE SECURITIES MAY NOT BE OFFERED, SOLD OR OTHERWISE TRANSFERRED, PLEDGED OR HYPOTHECATED EXCEPT AS PERMITTED UNDER THE ACT AND APPLICABLE STATE SECURITIES LAWS PURSUANT TO AN EFFECTIVE REGISTRATION STATEMENT OR AN EXEMPTION THEREFROM.

${company}

SAFE
(Simple Agreement for Future Equity)

THIS CERTIFIES THAT in exchange for the payment by ${investorName} (the "Investor") of ${amount} (the "Purchase Amount") on or about ${date}, ${company}, a ${state} corporation (the "Company"), hereby issues to the Investor the right to certain shares of the Company's capital stock, subject to the terms set forth below.

The "Valuation Cap" is ${valuationCap}.
The "Discount Rate" is ${discountRate}.

1. Events

(a) Equity Financing. If there is an Equity Financing before the expiration or termination of this instrument, the Company will automatically issue to the Investor a number of shares of Standard Preferred Stock equal to the Purchase Amount divided by the price per share of the Standard Preferred Stock, if the pre-money valuation is less than or equal to the Valuation Cap. Otherwise, the Investor will receive shares at a price equal to the Valuation Cap divided by the Company Capitalization.

(b) Liquidity Event. If there is a Liquidity Event before the expiration or termination of this instrument, the Investor will, at its option, either (i) receive a cash payment equal to the Purchase Amount or (ii) receive shares of Common Stock equal to the Purchase Amount divided by the Liquidity Price.

(c) Dissolution Event. If there is a Dissolution Event before this instrument expires or terminates, the Company will pay an amount equal to the Purchase Amount, due and payable to the Investor immediately prior to, or concurrent with, the consummation of the Dissolution Event.

2. Definitions

"Company Capitalization" means the sum of: (i) all shares of Capital Stock (on an as-converted basis) issued and outstanding, assuming exercise or conversion of all outstanding vested and unvested options, warrants and other convertible securities, but excluding (A) this instrument, (B) all other SAFEs, and (C) convertible promissory notes; and (ii) all shares of Common Stock reserved and available for future grant under any equity incentive or similar plan of the Company.

"Equity Financing" means a bona fide transaction or series of transactions with the principal purpose of raising capital, pursuant to which the Company issues and sells Preferred Stock at a fixed pre-money valuation.

"Liquidity Event" means a Change of Control or an Initial Public Offering.

"Liquidity Price" means the price per share equal to the Valuation Cap divided by the Liquidity Capitalization.

3. Company Representations

(a) The Company is a corporation duly organized, validly existing and in good standing under the laws of the state of its incorporation.

(b) The Company has the corporate power and authority to execute, deliver and perform this instrument.

4. Investor Representations

(a) The Investor has full legal capacity, power and authority to execute and deliver this instrument and to perform its obligations hereunder.

(b) The Investor is an accredited investor as such term is defined in Rule 501 of Regulation D under the Securities Act.

5. Miscellaneous

(a) This instrument shall be governed by and construed in accordance with the laws of the State of ${state}.

(b) Any provision of this instrument may be amended, waived or modified only upon the written consent of the Company and the Investor.

IN WITNESS WHEREOF, the undersigned have caused this instrument to be duly executed and delivered.


COMPANY:

${company}


By: ___________________________

Name: 

Title: 


INVESTOR:

${investorName}


By: ___________________________

Name: 

Date: ${date}
`;
  };

  const handleDownload = () => {
    setLoading(true);
    
    try {
      const document = generateSafeDocument();
      const blob = new Blob([document], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `SAFE_Template_${formData.investorName || 'Investor'}_${new Date().toISOString().split('T')[0]}.txt`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Template Downloaded",
        description: "Your SAFE template has been downloaded. Please send it via email for execution.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate template",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    const document = generateSafeDocument();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>SAFE Template Preview</title>
            <style>
              body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
              pre { white-space: pre-wrap; font-family: 'Times New Roman', serif; }
            </style>
          </head>
          <body>
            <pre>${document}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <FileText className="w-8 h-8" />
              SAFE Template Generator
            </CardTitle>
            <CardDescription>Generate a SAFE template to send via email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Important Disclaimer */}
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                <strong>Important Legal Notice:</strong> SAFE agreements cannot be executed through this platform. You must download this template and send it to the investor via email or other legal means for proper execution. This platform is for template generation and tracking only.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="investorName">Investor Name</Label>
                <Input
                  id="investorName"
                  placeholder="e.g., John Smith or Acme Ventures LLC"
                  value={formData.investorName}
                  onChange={(e) => setFormData({ ...formData, investorName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Investment Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 100000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valuationCap">Valuation Cap ($)</Label>
                <Input
                  id="valuationCap"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 5000000"
                  value={formData.valuationCap}
                  onChange={(e) => setFormData({ ...formData, valuationCap: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountRate">Discount Rate (%)</Label>
                <Input
                  id="discountRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="e.g., 20"
                  value={formData.discountRate}
                  onChange={(e) => setFormData({ ...formData, discountRate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="executionDate">Execution Date</Label>
                <Input
                  id="executionDate"
                  type="date"
                  value={formData.executionDate}
                  onChange={(e) => setFormData({ ...formData, executionDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePreview}
                className="flex-1"
              >
                Preview Template
              </Button>
              <Button 
                onClick={handleDownload} 
                disabled={loading}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                {loading ? "Generating..." : "Download Template"}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              After downloading, send this document to your investor via email for signature and execution.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SafeGenerator;