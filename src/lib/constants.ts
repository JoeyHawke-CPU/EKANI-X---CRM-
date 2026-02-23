// Kuwait governorate → area mapping
export const GOVERNORATE_AREAS: Record<string, string[]> = {
  "Al Asimah (Capital)": [
    "Kuwait City", "Sharq", "Mirqab", "Dasman", "Qibla", "Bneid Al Gar",
    "Kaifan", "Shuwaikh", "Adailiya", "Khaldiya", "Qortuba", "Yarmouk",
    "Rawda", "Surra", "Granada", "Sulaibikhat",
  ],
  Hawalli: [
    "Salmiya", "Hawalli", "Jabriya", "Bayan", "Rumaithiya", "Salwa",
    "Mishref", "Shaab", "Hateen", "Zahra",
  ],
  Farwaniya: [
    "Farwaniya", "Khaitan", "Jleeb Al-Shuyoukh", "Abdullah Al-Mubarak",
    "Omariya", "Ardiya", "Sabah Al-Nasser", "Rabia", "Riggae",
  ],
  Ahmadi: [
    "Fahaheel", "Mangaf", "Mahboula", "Abu Halifa", "Riqqa",
    "Sabah Al-Ahmad", "Wafra", "Egaila", "Hadiya", "Jaber Al-Ali",
  ],
  Jahra: [
    "Jahra", "Saad Al-Abdullah", "Sulaibiya", "Taima", "Oyoun", "Qasr",
  ],
  "Mubarak Al-Kabeer": [
    "Sabah Al-Salem", "Adan", "Qurain", "Qusoor", "Abu Fatira",
    "Messila", "Fintas",
  ],
};

export const GOVERNORATES = Object.keys(GOVERNORATE_AREAS);

export const LEAD_SOURCES = [
  "Visit", "Cold Calling", "Referral", "Social Media", "Website", "WhatsApp",
];

export const SOLUTIONS = [
  "Webbex", "Bolloh", "Marketing Package", "WhatsApp Business API",
  "AI UGC Ads", "Other",
];

export const ADD_ONS = [
  "Maintenance", "SEO-AEO", "Marketing", "Extra Pages", "E-Commerce",
];

export const LEAD_STATUSES = [
  "New Lead", "Contacted", "Follow-Up", "Meeting Scheduled", "Nurture",
  "Deal Confirmed – Pending Payment", "Paid – In Production",
  "Client Review", "Closed – Delivered", "Closed Lost",
] as const;
