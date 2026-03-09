import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface IntakeFormData {
  sales_exec_name: string;
  date_of_meeting: string;
  client_source: string;
  client_name: string;
  business_name: string;
  industry_type: string;
  industry_other: string;
  phone_number: string;
  whatsapp_number: string;
  email: string;
  business_address: string;
  google_maps_link: string;
  has_website: string;
  existing_url: string;
  prefixes_required: string;
  preferred_domain: string;
  pages_selected: string[];
  additional_pages: string;
  services_products: string;
  show_pricing: string;
  will_provide_logo: string;
  images_available: string[];
  needs_content_writing: string;
  instagram_link: string;
  facebook_link: string;
  tiktok_link: string;
  other_social: string;
  primary_contact_method: string;
  whatsapp_for_website: string;
  default_whatsapp_message: string;
  addons_selected: string[];
  working_hours_from: string;
  working_hours_to: string;
  template_shown: string;
  lockin_payment_received: string;
  payment_received: string;
  amount_received: string;
}

async function getAccessToken(credentials: any): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Base64URL encode
  const base64UrlEncode = (obj: any) => {
    const str = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach((b) => binary += String.fromCharCode(b));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const headerB64 = base64UrlEncode(header);
  const claimB64 = base64UrlEncode(claim);
  const unsignedToken = `${headerB64}.${claimB64}`;

  // Import the private key
  const pemContents = credentials.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const jwt = `${unsignedToken}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

async function appendToSheet(accessToken: string, spreadsheetId: string, data: IntakeFormData): Promise<void> {
  const values = [
    [
      new Date().toISOString(),
      data.sales_exec_name,
      data.date_of_meeting,
      data.client_source,
      data.client_name,
      data.business_name,
      data.industry_type,
      data.industry_other,
      data.phone_number,
      data.whatsapp_number,
      data.email,
      data.business_address,
      data.google_maps_link,
      data.has_website,
      data.existing_url,
      data.prefixes_required,
      data.preferred_domain,
      data.pages_selected.join(", "),
      data.additional_pages,
      data.services_products,
      data.show_pricing,
      data.will_provide_logo,
      data.images_available.join(", "),
      data.needs_content_writing,
      data.instagram_link,
      data.facebook_link,
      data.tiktok_link,
      data.other_social,
      data.primary_contact_method,
      data.whatsapp_for_website,
      data.default_whatsapp_message,
      data.addons_selected.join(", "),
      data.working_hours_from,
      data.working_hours_to,
      data.template_shown,
      data.lockin_payment_received,
      data.payment_received,
      data.amount_received,
    ],
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:AL:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to append to sheet: ${error}`);
  }
  
  await response.text(); // Consume response body
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_CREDENTIALS = Deno.env.get("GOOGLE_SHEETS_CREDENTIALS");
    if (!GOOGLE_CREDENTIALS) {
      throw new Error("GOOGLE_SHEETS_CREDENTIALS is not configured");
    }

    const SPREADSHEET_ID = Deno.env.get("GOOGLE_SPREADSHEET_ID");
    if (!SPREADSHEET_ID) {
      throw new Error("GOOGLE_SPREADSHEET_ID is not configured");
    }

    const credentials = JSON.parse(GOOGLE_CREDENTIALS);
    const formData: IntakeFormData = await req.json();

    // Get access token using service account
    const accessToken = await getAccessToken(credentials);

    // Append data to sheet
    await appendToSheet(accessToken, SPREADSHEET_ID, formData);

    return new Response(
      JSON.stringify({ success: true, message: "Form submitted to Google Sheets" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error submitting to Google Sheets:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
