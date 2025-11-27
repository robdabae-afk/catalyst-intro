import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SAFEData {
  safe_id: string;
  amount: number;
  valuation_cap: number | null;
  discount_rate: number | null;
  execution_date: string | null;
  company_name: string;
  company_state: string | null;
  company_address: string | null;
  founder_name: string;
  founder_email: string;
  investor_name: string;
  investor_email: string;
  investor_firm: string | null;
}

function generateYCSAFETemplate(data: SAFEData): string {
  const executionDate = data.execution_date 
    ? new Date(data.execution_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Date: ______________';
  
  const valuationCapText = data.valuation_cap 
    ? `$${data.valuation_cap.toLocaleString()}`
    : 'N/A';
  
  const discountText = data.discount_rate 
    ? `${data.discount_rate}%`
    : 'N/A';

  return `
SIMPLE AGREEMENT FOR FUTURE EQUITY
(Post-Money Valuation Cap & Discount Rate)

THIS CERTIFIES THAT in exchange for the payment by ${data.investor_name} (the "Investor") of $${data.amount.toLocaleString()} (the "Purchase Amount") on or about ${executionDate}, ${data.company_name}, a ${data.company_state || '[State]'} corporation (the "Company"), issues to the Investor the right to certain shares of the Company's Capital Stock, subject to the terms described below.

This Simple Agreement for Future Equity ("SAFE") is one of the forms available at http://ycombinator.com/documents and the Company and the Investor agree that neither one has modified the form, except to fill in blanks and bracketed terms.

ARTICLE 1: DEFINITIONS

1.1 "Capital Stock" means the capital stock of the Company, including, without limitation, the "Common Stock" and the "Preferred Stock."

1.2 "Change of Control" means (i) a transaction or series of related transactions in which any "person" or "group" (within the meaning of Section 13(d) and 14(d) of the Securities Exchange Act of 1934, as amended), becomes the "beneficial owner" (as defined in Rule 13d-3 under the Securities Exchange Act of 1934, as amended), directly or indirectly, of more than 50% of the outstanding voting securities of the Company having the right to vote for the election of members of the Company's board of directors, (ii) any reorganization, merger or consolidation of the Company, other than a transaction or series of related transactions in which the holders of the voting securities of the Company outstanding immediately prior to such transaction or series of related transactions retain, immediately after such transaction or series of related transactions, at least a majority of the total voting power represented by the outstanding voting securities of the Company or such other surviving or resulting entity or (iii) a sale, lease or other disposition of all or substantially all of the assets of the Company.

1.3 "Company Capitalization" means the sum of: (i) all shares of Capital Stock (on an as-converted basis) issued and outstanding, assuming exercise or conversion of all outstanding vested and unvested options, warrants and other convertible securities, but excluding (A) this SAFE, (B) all other SAFEs, and (C) convertible promissory notes; and (ii) all shares of Common Stock reserved and available for future grant under any equity incentive or similar plan of the Company, and/or any equity incentive or similar plan to be created or increased in connection with the Equity Financing.

1.4 "Conversion Price" means either: (1) the Safe Price or (2) the Discount Price, whichever calculation results in a greater number of shares of Safe Preferred Stock.

1.5 "Discount Price" means the price per share of the Standard Preferred Stock sold in the Equity Financing multiplied by the Discount Rate (${discountText}).

1.6 "Dissolution Event" means (i) a voluntary termination of operations, (ii) a general assignment for the benefit of the Company's creditors or (iii) any other liquidation, dissolution or winding up of the Company (excluding a Liquidity Event), whether voluntary or involuntary.

1.7 "Equity Financing" means a bona fide transaction or series of transactions with the principal purpose of raising capital, pursuant to which the Company issues and sells Preferred Stock at a fixed valuation.

1.8 "Initial Public Offering" means the closing of the Company's first firm commitment underwritten initial public offering of Common Stock pursuant to a registration statement filed under the Securities Act.

1.9 "Liquidity Capitalization" means the number, as of immediately prior to the Liquidity Event, of shares of Capital Stock (on an as-converted basis) outstanding, assuming exercise or conversion of all outstanding vested and unvested options, warrants and other convertible securities, but excluding: (i) shares of Common Stock reserved and available for future grant under any equity incentive or similar plan; (ii) this SAFE; (iii) other SAFEs; and (iv) convertible promissory notes.

1.10 "Liquidity Event" means a Change of Control or an Initial Public Offering.

1.11 "Liquidity Price" means the price per share equal to the Post-Money Valuation Cap divided by the Liquidity Capitalization.

1.12 "Post-Money Valuation Cap" means ${valuationCapText}.

1.13 "Safe Preferred Stock" means the shares of a series of Preferred Stock issued to the Investor in an Equity Financing, having the identical rights, privileges, preferences and restrictions as the shares of Standard Preferred Stock, other than with respect to: (i) the per share liquidation preference and the conversion price for purposes of price-based anti-dilution protection, which will equal the Conversion Price; and (ii) the basis for any dividend rights, which will be based on the Conversion Price.

1.14 "Safe Price" means the price per share equal to the Post-Money Valuation Cap divided by the Company Capitalization.

1.15 "Standard Preferred Stock" means the shares of a series of Preferred Stock issued to the investors investing new money in the Company in connection with the initial closing of the Equity Financing.

ARTICLE 2: COMPANY REPRESENTATIONS

2.1 The Company is a corporation duly organized, validly existing and in good standing under the laws of ${data.company_state || '[State]'}, and has the power and authority to own, lease and operate its properties and carry on its business as now conducted.

2.2 The execution, delivery and performance by the Company of this SAFE is within the power of the Company and has been duly authorized by all necessary actions on the part of the Company. This SAFE constitutes a legal, valid and binding obligation of the Company, enforceable against the Company in accordance with its terms, except as limited by bankruptcy, insolvency or other laws of general application relating to or affecting the enforcement of creditors' rights generally and general principles of equity.

ARTICLE 3: INVESTOR REPRESENTATIONS

3.1 The Investor has full legal capacity, power and authority to execute and deliver this SAFE and to perform its obligations hereunder. This SAFE constitutes valid and binding obligation of the Investor, enforceable in accordance with its terms, except as limited by bankruptcy, insolvency or other laws of general application relating to or affecting the enforcement of creditors' rights generally and general principles of equity.

3.2 The Investor is an accredited investor as such term is defined in Rule 501 of Regulation D under the Securities Act. The Investor has been advised that this SAFE and the underlying securities have not been registered under the Securities Act, or any state securities laws and, therefore, cannot be resold unless they are registered under the Securities Act and applicable state securities laws or unless an exemption from such registration requirements is available.

ARTICLE 4: EVENTS

4.1 Equity Financing. If there is an Equity Financing before the expiration or termination of this SAFE, the Company will automatically issue to the Investor either: (i) a number of shares of Standard Preferred Stock equal to the Purchase Amount divided by the price per share of the Standard Preferred Stock, if the pre-money valuation is less than or equal to the Post-Money Valuation Cap; or (ii) a number of shares of Safe Preferred Stock equal to the Purchase Amount divided by the Safe Price, if the pre-money valuation is greater than the Post-Money Valuation Cap.

4.2 Liquidity Event. If there is a Liquidity Event before the expiration or termination of this SAFE, the Investor will, at its option, either (i) receive a cash payment equal to the Purchase Amount or (ii) automatically receive from the Company a number of shares of Common Stock equal to the Purchase Amount divided by the Liquidity Price.

4.3 Dissolution Event. If there is a Dissolution Event before this SAFE expires or terminates, the Company will pay an amount equal to the Purchase Amount, due and payable to the Investor immediately prior to, or concurrent with, the consummation of the Dissolution Event.

IN WITNESS WHEREOF, the undersigned have caused this SAFE to be duly executed and delivered.

COMPANY:
${data.company_name}

By: _____________________________
Name: ${data.founder_name}
Title: Chief Executive Officer
Date: ${executionDate}

Email: ${data.founder_email}
${data.company_address || ''}

INVESTOR:
${data.investor_name}
${data.investor_firm ? `(${data.investor_firm})` : ''}

By: _____________________________
Name: ${data.investor_name}
Date: ________________

Email: ${data.investor_email}
`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { safeId } = await req.json();

    if (!safeId) {
      throw new Error('SAFE ID is required');
    }

    // Get SAFE details using the database function
    const { data: safeData, error: fetchError } = await supabaseClient
      .rpc('generate_safe_content', { safe_id: safeId });

    if (fetchError || !safeData) {
      throw new Error(fetchError?.message || 'Failed to fetch SAFE data');
    }

    // Generate the SAFE document text
    const documentText = generateYCSAFETemplate(safeData);

    // Update the SAFE with the document text
    const { error: updateError } = await supabaseClient
      .from('safes')
      .update({ 
        document_url: documentText,
        status: 'pending_signatures'
      })
      .eq('id', safeId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SAFE document generated successfully',
        documentText 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating SAFE:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
