import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, FileText, AlertTriangle, Download } from "lucide-react";

const SafeDetail = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/captable')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cap Table
        </Button>

        <Card className="shadow-lg mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <FileText className="w-8 h-8" />
                  SAFE Agreements
                </CardTitle>
                <CardDescription>Template generation and off-platform execution</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Important Disclaimer */}
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                <strong>Important Legal Notice:</strong> SAFE agreements cannot be signed or executed through this platform. All legal documents must be sent and signed off-platform via email or other legal means. This is to ensure proper legal compliance and document validity.
              </AlertDescription>
            </Alert>

            <div className="bg-muted/30 rounded-lg p-6 text-center space-y-4">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold">Generate SAFE Templates</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Use our SAFE template generator to create customized Simple Agreement for Future Equity documents. 
                Once generated, download the template and send it to your investor via email for execution.
              </p>
              <Button onClick={() => navigate('/safe')} size="lg">
                <Download className="w-4 h-4 mr-2" />
                Generate SAFE Template
              </Button>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4">How it works:</h3>
              <ol className="space-y-3 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">1</span>
                  <span>Fill in the investment details (amount, valuation cap, discount rate)</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">2</span>
                  <span>Download the generated SAFE template document</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">3</span>
                  <span>Send the document to your investor via email for review and signature</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">4</span>
                  <span>Track the investment manually in your Cap Table once executed</span>
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SafeDetail;