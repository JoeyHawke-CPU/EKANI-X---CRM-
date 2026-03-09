import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  CLIENT_SOURCES,
  INDUSTRY_TYPES,
  WEBSITE_PAGES,
  IMAGE_OPTIONS,
  INTAKE_ADD_ONS,
  CONTACT_METHODS,
  INTAKE_SECTIONS,
  WORKING_HOURS_OPTIONS,
} from "@/lib/intakeFormConstants";

export interface IntakeFormData {
  // Section 1
  sales_exec_name: string;
  date_of_meeting: string;
  client_source: string;
  // Section 2
  client_name: string;
  business_name: string;
  industry_type: string;
  industry_other: string;
  phone_number: string;
  whatsapp_number: string;
  email: string;
  business_address: string;
  google_maps_link: string;
  // Section 3
  has_website: string;
  existing_url: string;
  preferred_domain: string;
  // Section 4
  pages_selected: string[];
  additional_pages: string;
  // Section 5
  services_products: string;
  show_pricing: string;
  // Section 6
  will_provide_logo: string;
  images_available: string[];
  needs_content_writing: string;
  // Section 7
  instagram_link: string;
  facebook_link: string;
  tiktok_link: string;
  other_social: string;
  // Section 8
  primary_contact_method: string;
  whatsapp_for_website: string;
  default_whatsapp_message: string;
  // Section 9
  addons_selected: string[];
  // Section 10
  working_hours: string;
  booking_services: string;
  // Section 11
  template_shown: string;
  addons_summary: string;
  lockin_payment_received: string;
  payment_received: string;
  amount_received: string;
}

interface ClientIntakeFormProps {
  initialData?: Partial<IntakeFormData>;
  onClose: () => void;
}

const defaultData: IntakeFormData = {
  sales_exec_name: "",
  date_of_meeting: "",
  client_source: "",
  client_name: "",
  business_name: "",
  industry_type: "",
  industry_other: "",
  phone_number: "",
  whatsapp_number: "",
  email: "",
  business_address: "",
  google_maps_link: "",
  has_website: "",
  existing_url: "",
  preferred_domain: "",
  pages_selected: [],
  additional_pages: "",
  services_products: "",
  show_pricing: "",
  will_provide_logo: "",
  images_available: [],
  needs_content_writing: "",
  instagram_link: "",
  facebook_link: "",
  tiktok_link: "",
  other_social: "",
  primary_contact_method: "",
  whatsapp_for_website: "",
  default_whatsapp_message: "",
  addons_selected: [],
  working_hours: "",
  booking_services: "",
  template_shown: "",
  addons_summary: "",
  lockin_payment_received: "",
  payment_received: "",
  amount_received: "",
};

const ClientIntakeForm: React.FC<ClientIntakeFormProps> = ({ initialData, onClose }) => {
  const [section, setSection] = useState(0);
  const [form, setForm] = useState<IntakeFormData>({ ...defaultData, ...initialData });

  const set = (key: keyof IntakeFormData, value: any) =>
    setForm((p) => ({ ...p, [key]: value }));

  const toggleArray = (key: "pages_selected" | "images_available" | "addons_selected", value: string) => {
    setForm((p) => {
      const arr = p[key] as string[];
      const s = new Set(arr);
      if (s.has(value)) s.delete(value);
      else s.add(value);
      return { ...p, [key]: Array.from(s) };
    });
  };

  const handleSubmit = () => {
    if (!form.client_name && !form.business_name) {
      toast.error("Please fill in at least the client or business name");
      return;
    }
    // For now, copy to clipboard as JSON (Google Sheets integration later)
    const json = JSON.stringify(form, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      toast.success("Intake form data copied to clipboard! Google Sheets integration coming soon.");
    }).catch(() => {
      toast.success("Intake form completed! Google Sheets integration coming soon.");
    });
    console.log("Intake Form Data:", form);
  };

  const progressPercent = ((section + 1) / INTAKE_SECTIONS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Section {section + 1} of {INTAKE_SECTIONS.length}</span>
          <span className="font-medium">{Math.round(progressPercent)}% complete</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Section title */}
      <div className="border-b pb-3">
        <h3 className="text-base font-semibold">{INTAKE_SECTIONS[section]}</h3>
      </div>

      {/* Section indicator — scrollable */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
        {INTAKE_SECTIONS.map((s, i) => (
          <button
            key={s}
            onClick={() => setSection(i)}
            className={`shrink-0 py-2 px-3 text-xs font-medium rounded-md transition-colors ${
              i === section
                ? "bg-primary text-primary-foreground"
                : i < section
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Section 1 — Sales Information */}
      {section === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Sales Executive Name</Label>
            <Input value={form.sales_exec_name} onChange={(e) => set("sales_exec_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Date of Client Meeting</Label>
            <Input type="date" value={form.date_of_meeting} onChange={(e) => set("date_of_meeting", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Client Source</Label>
            <Select value={form.client_source} onValueChange={(v) => set("client_source", v)}>
              <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
              <SelectContent>
                {CLIENT_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Section 2 — Client Information */}
      {section === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Client Name</Label>
            <Input value={form.client_name} onChange={(e) => set("client_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Business Name</Label>
            <Input value={form.business_name} onChange={(e) => set("business_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Industry / Business Type</Label>
            <Select value={form.industry_type} onValueChange={(v) => set("industry_type", v)}>
              <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
              <SelectContent>
                {INDUSTRY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {form.industry_type === "Other" && (
            <div className="space-y-2">
              <Label>Specify Industry</Label>
              <Input value={form.industry_other} onChange={(e) => set("industry_other", e.target.value)} placeholder="Type industry..." maxLength={100} />
            </div>
          )}
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp Number</Label>
            <Input value={form.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Business Address</Label>
            <Textarea value={form.business_address} onChange={(e) => set("business_address", e.target.value)} rows={2} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Google Maps Location Link</Label>
            <Input value={form.google_maps_link} onChange={(e) => set("google_maps_link", e.target.value)} placeholder="https://maps.google.com/..." />
          </div>
        </div>
      )}

      {/* Section 3 — Existing Website */}
      {section === 2 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3 sm:col-span-2">
            <Label>Does the client currently have a website?</Label>
            <RadioGroup value={form.has_website} onValueChange={(v) => set("has_website", v)} className="flex gap-6">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="Yes" id="hw-yes" />
                <Label htmlFor="hw-yes" className="cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="No" id="hw-no" />
                <Label htmlFor="hw-no" className="cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>
          {form.has_website === "Yes" && (
            <div className="space-y-2 sm:col-span-2">
              <Label>Website URL</Label>
              <Input value={form.existing_url} onChange={(e) => set("existing_url", e.target.value)} placeholder="https://..." />
            </div>
          )}
          <div className="space-y-2 sm:col-span-2">
            <Label>Preferred Domain Name (if creating new website)</Label>
            <Input value={form.preferred_domain} onChange={(e) => set("preferred_domain", e.target.value)} placeholder="www.businessname.com" />
          </div>
        </div>
      )}

      {/* Section 4 — Website Pages Required */}
      {section === 3 && (
        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Which pages does the client want?</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {WEBSITE_PAGES.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={form.pages_selected.includes(p)}
                    onCheckedChange={() => toggleArray("pages_selected", p)}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Additional Pages (if any)</Label>
            <Input value={form.additional_pages} onChange={(e) => set("additional_pages", e.target.value)} placeholder="e.g. FAQ, Careers" />
          </div>
        </div>
      )}

      {/* Section 5 — Services / Products */}
      {section === 4 && (
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>List the main services or products offered</Label>
            <Textarea value={form.services_products} onChange={(e) => set("services_products", e.target.value)} rows={4} placeholder="e.g. Haircut, Hair Coloring, Facial Treatment" />
          </div>
          <div className="space-y-3">
            <Label>Do they want pricing displayed on the website?</Label>
            <RadioGroup value={form.show_pricing} onValueChange={(v) => set("show_pricing", v)} className="flex gap-6">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="Yes" id="sp-yes" />
                <Label htmlFor="sp-yes" className="cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="No" id="sp-no" />
                <Label htmlFor="sp-no" className="cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      )}

      {/* Section 6 — Media & Content */}
      {section === 5 && (
        <div className="grid gap-4">
          <div className="space-y-3">
            <Label>Will the client provide the logo?</Label>
            <RadioGroup value={form.will_provide_logo} onValueChange={(v) => set("will_provide_logo", v)} className="flex gap-6">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="Yes" id="logo-yes" />
                <Label htmlFor="logo-yes" className="cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="No" id="logo-no" />
                <Label htmlFor="logo-no" className="cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-3">
            <Label>Images available</Label>
            <div className="flex flex-wrap gap-3">
              {IMAGE_OPTIONS.map((img) => (
                <label key={img} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={form.images_available.includes(img)}
                    onCheckedChange={() => toggleArray("images_available", img)}
                  />
                  {img}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Label>Does the client require EKANI to write website content?</Label>
            <RadioGroup value={form.needs_content_writing} onValueChange={(v) => set("needs_content_writing", v)} className="flex gap-6">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="Yes" id="cw-yes" />
                <Label htmlFor="cw-yes" className="cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="No" id="cw-no" />
                <Label htmlFor="cw-no" className="cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      )}

      {/* Section 7 — Social Media */}
      {section === 6 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Instagram Link</Label>
            <Input value={form.instagram_link} onChange={(e) => set("instagram_link", e.target.value)} placeholder="https://instagram.com/..." />
          </div>
          <div className="space-y-2">
            <Label>Facebook Link</Label>
            <Input value={form.facebook_link} onChange={(e) => set("facebook_link", e.target.value)} placeholder="https://facebook.com/..." />
          </div>
          <div className="space-y-2">
            <Label>TikTok Link</Label>
            <Input value={form.tiktok_link} onChange={(e) => set("tiktok_link", e.target.value)} placeholder="https://tiktok.com/..." />
          </div>
          <div className="space-y-2">
            <Label>Other Social Media</Label>
            <Input value={form.other_social} onChange={(e) => set("other_social", e.target.value)} />
          </div>
        </div>
      )}

      {/* Section 8 — Lead Capture Setup */}
      {section === 7 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3 sm:col-span-2">
            <Label>Primary contact method for the website</Label>
            <RadioGroup value={form.primary_contact_method} onValueChange={(v) => set("primary_contact_method", v)} className="flex flex-wrap gap-4">
              {CONTACT_METHODS.map((m) => (
                <div key={m} className="flex items-center gap-2">
                  <RadioGroupItem value={m} id={`cm-${m}`} />
                  <Label htmlFor={`cm-${m}`} className="cursor-pointer">{m}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>WhatsApp Number for Website</Label>
            <Input value={form.whatsapp_for_website} onChange={(e) => set("whatsapp_for_website", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Default WhatsApp Message (Optional)</Label>
            <Input value={form.default_whatsapp_message} onChange={(e) => set("default_whatsapp_message", e.target.value)} placeholder="Hello, I would like more information about your services." />
          </div>
        </div>
      )}

      {/* Section 9 — Website Features / Add-Ons */}
      {section === 8 && (
        <div className="space-y-3">
          <Label>Select the add-ons the client wants</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {INTAKE_ADD_ONS.map((addon) => (
              <label key={addon} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={form.addons_selected.includes(addon)}
                  onCheckedChange={() => toggleArray("addons_selected", addon)}
                />
                {addon}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Section 10 — Booking / Appointment */}
      {section === 9 && (
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Working Hours</Label>
            <Input value={form.working_hours} onChange={(e) => set("working_hours", e.target.value)} placeholder="e.g. 9am – 9pm" />
          </div>
          <div className="space-y-2">
            <Label>Services available for booking</Label>
            <Textarea value={form.booking_services} onChange={(e) => set("booking_services", e.target.value)} rows={3} />
          </div>
        </div>
      )}

      {/* Section 11 — Project Confirmation */}
      {section === 10 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Website template shown to client</Label>
            <Input value={form.template_shown} onChange={(e) => set("template_shown", e.target.value)} placeholder="e.g. EKANI-004" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Add-ons selected</Label>
            <Textarea value={form.addons_summary} onChange={(e) => set("addons_summary", e.target.value)} rows={3} placeholder="Summary of selected add-ons" />
          </div>
          <div className="space-y-3">
            <Label>KD 10 Lock-in Payment Received?</Label>
            <RadioGroup value={form.lockin_payment_received} onValueChange={(v) => set("lockin_payment_received", v)} className="flex gap-6">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="Yes" id="lp-yes" />
                <Label htmlFor="lp-yes" className="cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="No" id="lp-no" />
                <Label htmlFor="lp-no" className="cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-3">
            <Label>Payment Received?</Label>
            <RadioGroup value={form.payment_received} onValueChange={(v) => set("payment_received", v)} className="flex gap-6">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="Yes" id="pr-yes" />
                <Label htmlFor="pr-yes" className="cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="No" id="pr-no" />
                <Label htmlFor="pr-no" className="cursor-pointer">No</Label>
              </div>
            </RadioGroup>
          </div>
          {form.payment_received === "Yes" && (
            <div className="space-y-2">
              <Label>Amount Received</Label>
              <Input type="number" step="0.001" value={form.amount_received} onChange={(e) => set("amount_received", e.target.value)} placeholder="Amount in KD" />
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={section === 0 ? onClose : () => setSection(section - 1)}>
          {section === 0 ? "Cancel" : "Back"}
        </Button>
        {section < INTAKE_SECTIONS.length - 1 ? (
          <Button onClick={() => setSection(section + 1)}>Next</Button>
        ) : (
          <Button onClick={handleSubmit}>
            Submit Intake Form
          </Button>
        )}
      </div>
    </div>
  );
};

export default ClientIntakeForm;
