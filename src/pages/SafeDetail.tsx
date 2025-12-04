import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, CheckCircle, Clock, Send, Printer } from "lucide-react";
import { SignaturePad } from "@/components/SignaturePad";

interface SAFEDetails {
  id: string;
  amount: number;
  valuation_cap: number | null;
  discount_rate: number | null;
  execution_date: string | null;
  status: string;
  document_url: string | null;
  founder_id: string;
  investor_id: string;
  founder_signed_at: string | null;
  founder_signature_data: string | null;
  investor_signed_at: string | null;
  investor_signature_data: string | null;
  founder: {
    name: string;
  };
  investor: {
    name: string;
  };
}

const SafeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [safe, setSafe] = useState<SAFEDetails | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    checkUser();
    loadSafe();
  }, [id]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }
    setCurrentUserId(user.id);
  };

  const loadSafe = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('safes')
        .select(`
          *,
          founder:profiles!safes_founder_id_fkey(name),
          investor:profiles!safes_investor_id_fkey(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setSafe(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading SAFE",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const sendToInvestor = async () => {
    if (!id) return;

    setGenerating(true);
    try {
      // First generate the document
      const { error: genError } = await supabase.functions.invoke('generate-safe-pdf', {
        body: { safeId: id }
      });

      if (genError) throw genError;

      // Then update status to 'sent'
      const { error: updateError } = await supabase
        .from('safes')
        .update({ status: 'sent' })
        .eq('id', id);

      if (updateError) throw updateError;

      toast({
        title: "SAFE Sent!",
        description: "The investor has been notified and can now review and sign.",
      });

      await loadSafe();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error sending SAFE",
        description: error.message
      });
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && safe?.document_url) {
      printWindow.document.write(`
        <html>
          <head>
            <title>SAFE Agreement - ${safe.investor.name}</title>
            <style>
              body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; }
              pre { white-space: pre-wrap; font-family: 'Times New Roman', serif; }
              .signature-section { margin-top: 40px; display: flex; gap: 40px; }
              .signature-box { flex: 1; }
              .signature-box img { max-width: 200px; height: auto; }
              @media print { body { padding: 20px; } }
            </style>
          </head>
          <body>
            <pre>${safe.document_url}</pre>
            ${safe.founder_signature_data || safe.investor_signature_data ? `
              <div class="signature-section">
                ${safe.founder_signature_data ? `
                  <div class="signature-box">
                    <p><strong>Founder Signature:</strong></p>
                    <img src="${safe.founder_signature_data}" alt="Founder Signature" />
                    <p>Signed: ${new Date(safe.founder_signed_at!).toLocaleDateString()}</p>
                  </div>
                ` : ''}
                ${safe.investor_signature_data ? `
                  <div class="signature-box">
                    <p><strong>Investor Signature:</strong></p>
                    <img src="${safe.investor_signature_data}" alt="Investor Signature" />
                    <p>Signed: ${new Date(safe.investor_signed_at!).toLocaleDateString()}</p>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSignature = async (signatureData: string) => {
    if (!currentUserId || !id) return;

    try {
      const isFounder = currentUserId === safe?.founder_id;
      const updateData = isFounder
        ? {
            founder_signature_data: signatureData,
            founder_signed_at: new Date().toISOString()
          }
        : {
            investor_signature_data: signatureData,
            investor_signed_at: new Date().toISOString()
          };

      const { error } = await supabase
        .from('safes')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Document signed successfully",
      });

      setShowSignaturePad(false);
      await loadSafe();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving signature",
        description: error.message
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading SAFE details...</p>
        </div>
      </div>
    );
  }

  if (!safe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">SAFE not found</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isFounder = currentUserId === safe.founder_id;
  const isInvestor = currentUserId === safe.investor_id;
  const canSign = (isFounder && !safe.founder_signed_at && safe.status !== 'draft') || 
                  (isInvestor && !safe.investor_signed_at && safe.status !== 'draft');
  const bothSigned = safe.founder_signed_at && safe.investor_signed_at;
  const isDraft = safe.status === 'draft';
  const isSent = safe.status === 'sent' || safe.status === 'pending_signatures';

  const getStatusBadge = () => {
    if (bothSigned) return <Badge className="bg-green-500">Executed</Badge>;
    if (safe.status === 'sent' || safe.status === 'pending_signatures') 
      return <Badge variant="secondary">Pending Signatures</Badge>;
    return <Badge variant="outline">Draft</Badge>;
  };

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
                  SAFE Agreement
                </CardTitle>
                <CardDescription>Simple Agreement for Future Equity</CardDescription>
              </div>
              <div className="text-right flex items-center gap-2">
                {getStatusBadge()}
                {bothSigned && (
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print PDF
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">Investment Details</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Investment Amount</dt>
                    <dd className="font-semibold text-lg">${safe.amount.toLocaleString()}</dd>
                  </div>
                  {safe.valuation_cap && (
                    <div>
                      <dt className="text-sm text-muted-foreground">Valuation Cap</dt>
                      <dd className="font-semibold">${safe.valuation_cap.toLocaleString()}</dd>
                    </div>
                  )}
                  {safe.discount_rate && (
                    <div>
                      <dt className="text-sm text-muted-foreground">Discount Rate</dt>
                      <dd className="font-semibold">{safe.discount_rate}%</dd>
                    </div>
                  )}
                  {safe.execution_date && (
                    <div>
                      <dt className="text-sm text-muted-foreground">Execution Date</dt>
                      <dd className="font-semibold">
                        {new Date(safe.execution_date).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Parties</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">Founder</dt>
                    <dd className="font-semibold">{safe.founder.name}</dd>
                    {safe.founder_signed_at ? (
                      <div className="flex items-center gap-2 text-green-600 text-sm mt-1">
                        <CheckCircle className="w-4 h-4" />
                        Signed on {new Date(safe.founder_signed_at).toLocaleDateString()}
                      </div>
                    ) : (
                      <div className="text-sm text-yellow-600 mt-1">Signature pending</div>
                    )}
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Investor</dt>
                    <dd className="font-semibold">{safe.investor.name}</dd>
                    {safe.investor_signed_at ? (
                      <div className="flex items-center gap-2 text-green-600 text-sm mt-1">
                        <CheckCircle className="w-4 h-4" />
                        Signed on {new Date(safe.investor_signed_at).toLocaleDateString()}
                      </div>
                    ) : (
                      <div className="text-sm text-yellow-600 mt-1">Signature pending</div>
                    )}
                  </div>
                </dl>
              </div>
            </div>

            {/* Founder actions for draft SAFE */}
            {isDraft && isFounder && (
              <div className="pt-4 border-t">
                <Button 
                  onClick={sendToInvestor} 
                  disabled={generating}
                  size="lg"
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {generating ? "Sending..." : "Send SAFE to Investor"}
                </Button>
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  This will generate the document and notify the investor for signing.
                </p>
              </div>
            )}

            {/* Document preview for sent SAFEs */}
            {isSent && safe.document_url && (
              <>
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-lg mb-3">Document Preview</h3>
                  <div className="bg-muted/30 p-6 rounded-lg max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {safe.document_url}
                    </pre>
                  </div>
                </div>

                {canSign && !showSignaturePad && (
                  <div className="pt-4 flex gap-4">
                    <Button 
                      onClick={() => setShowSignaturePad(true)}
                      size="lg"
                      className="flex-1"
                    >
                      Sign Document
                    </Button>
                  </div>
                )}

                {showSignaturePad && (
                  <div className="pt-4">
                    <SignaturePad
                      onSave={handleSignature}
                      onCancel={() => setShowSignaturePad(false)}
                    />
                  </div>
                )}
              </>
            )}

            {/* Show document for executed SAFEs */}
            {bothSigned && safe.document_url && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-lg mb-3">Executed Document</h3>
                <div className="bg-muted/30 p-6 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {safe.document_url}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SafeDetail;
