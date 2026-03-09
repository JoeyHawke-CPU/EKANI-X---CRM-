import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  GOVERNORATE_AREAS,
  GOVERNORATES,
  LEAD_SOURCES,
  SOLUTIONS,
  ADD_ONS,
  LEAD_STATUSES,
} from "@/lib/constants";
import type { Database } from "@/integrations/supabase/types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];

interface LeadFormProps {
  lead?: LeadRow | null;
  onClose: () => void;
}

const STEPS = ["Client Info", "Qualification", "Financials", "Delivery & Tracking"];

const LeadForm: React.FC<LeadFormProps> = ({ lead, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    client_business_name: lead?.client_business_name || "",
    client_contact_person: lead?.client_contact_person || "",
    phone_number: lead?.phone_number || "",
    whatsapp_number: lead?.whatsapp_number || "",
    email: lead?.email || "",
    governorate: lead?.governorate || "",
    area: lead?.area || "",
    business_full_address: lead?.business_full_address || "",
    lead_source: lead?.lead_source || "",
    domain_status: lead?.domain_status || "",
    decision_maker_confirmed: lead?.decision_maker_confirmed || false,
    budget_confirmed: lead?.budget_confirmed || false,
    timeline_days: lead?.timeline_days?.toString() || "",
    solution_selected: lead?.solution_selected || "",
    add_ons: lead?.add_ons || "",
    quoted_amount_kd: lead?.quoted_amount_kd?.toString() || "0",
    final_agreed_amount_kd: lead?.final_agreed_amount_kd?.toString() || "0",
    commission_percentage: lead?.commission_percentage?.toString() || "0",
    intake_form_completed: lead?.intake_form_completed || false,
    payment_link_sent: lead?.payment_link_sent || false,
    payment_received: lead?.payment_received || false,
    invoice_generated: lead?.invoice_generated || false,
    production_deadline: lead?.production_deadline || "",
    preview_sent_date: lead?.preview_sent_date || "",
    go_live_date: lead?.go_live_date || "",
    followup_7day_completed: lead?.followup_7day_completed || false,
    refund_cancellation: lead?.refund_cancellation || false,
    escalation_required: lead?.escalation_required || false,
    followup_due_date: lead?.followup_due_date || "",
    remarks: lead?.remarks || "",
    delivery_tracking_status: (lead as any)?.delivery_tracking_status || "Ongoing",
    status: lead?.status || "New Lead",
  });

  const set = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  const selectedAddOns = form.add_ons ? form.add_ons.split(", ").filter(Boolean) : [];
  const toggleAddOn = (addon: string) => {
    const current = new Set(selectedAddOns);
    if (current.has(addon)) current.delete(addon);
    else current.add(addon);
    set("add_ons", Array.from(current).join(", "));
  };

  // Parse solution_selected: may contain "Other: <text>"
  const parseSolutions = (raw: string) => {
    if (!raw) return { selected: [] as string[], otherText: "" };
    const parts = raw.split(", ").filter(Boolean);
    const otherPart = parts.find((p) => p.startsWith("Other:"));
    const otherText = otherPart ? otherPart.replace("Other: ", "") : "";
    const selected = parts.map((p) => (p.startsWith("Other:") ? "Other" : p));
    return { selected, otherText };
  };
  const { selected: selectedSolutions, otherText: initialOtherText } = parseSolutions(form.solution_selected);
  const [otherSolutionText, setOtherSolutionText] = useState(initialOtherText);

  const toggleSolution = (sol: string) => {
    const current = new Set(selectedSolutions);
    if (current.has(sol)) {
      current.delete(sol);
      if (sol === "Other") setOtherSolutionText("");
    } else {
      current.add(sol);
    }
    buildSolutionString(current, sol === "Other" && !current.has("Other") ? "" : otherSolutionText);
  };

  const buildSolutionString = (sols: Set<string>, otherVal: string) => {
    const parts = Array.from(sols).map((s) => (s === "Other" && otherVal ? `Other: ${otherVal}` : s === "Other" ? "Other" : s));
    set("solution_selected", parts.join(", "));
  };

  const handleOtherTextChange = (val: string) => {
    setOtherSolutionText(val);
    const current = new Set(selectedSolutions);
    buildSolutionString(current, val);
  };

  const areas = form.governorate ? GOVERNORATE_AREAS[form.governorate] || [] : [];

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const payload: any = {
      client_business_name: form.client_business_name,
      client_contact_person: form.client_contact_person || null,
      phone_number: form.phone_number || null,
      whatsapp_number: form.whatsapp_number || null,
      email: form.email || null,
      governorate: form.governorate || null,
      area: form.area || null,
      business_full_address: form.business_full_address || null,
      lead_source: form.lead_source || null,
      domain_status: form.domain_status || null,
      decision_maker_confirmed: form.decision_maker_confirmed,
      budget_confirmed: form.budget_confirmed,
      timeline_days: form.timeline_days ? parseInt(form.timeline_days) : null,
      solution_selected: form.solution_selected || null,
      add_ons: form.add_ons || null,
      quoted_amount_kd: parseFloat(form.quoted_amount_kd) || 0,
      final_agreed_amount_kd: parseFloat(form.final_agreed_amount_kd) || 0,
      commission_percentage: parseFloat(form.commission_percentage) || 0,
      intake_form_completed: form.intake_form_completed,
      payment_link_sent: form.payment_link_sent,
      payment_received: form.payment_received,
      invoice_generated: form.invoice_generated,
      production_deadline: form.production_deadline || null,
      preview_sent_date: form.preview_sent_date || null,
      go_live_date: form.go_live_date || null,
      followup_7day_completed: form.followup_7day_completed,
      refund_cancellation: form.refund_cancellation,
      escalation_required: form.escalation_required,
      followup_due_date: form.followup_due_date || null,
      remarks: form.remarks || null,
      delivery_tracking_status: form.delivery_tracking_status || "Ongoing",
      status: form.status as any,
    };

    let error;
    if (lead) {
      ({ error } = await supabase.from("leads").update(payload).eq("lead_id", lead.lead_id));
    } else {
      payload.sales_exec_id = user.id;
      ({ error } = await supabase.from("leads").insert(payload));
    }

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(lead ? "Lead updated" : "Lead created");
      queryClient.invalidateQueries({ queryKey: ["my-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex gap-1">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
              i === step
                ? "bg-primary text-primary-foreground"
                : i < step
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Step 1: Client Info */}
      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Business Name *</Label>
            <Input value={form.client_business_name} onChange={(e) => set("client_business_name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Contact Person</Label>
            <Input value={form.client_contact_person} onChange={(e) => set("client_contact_person", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input value={form.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Governorate</Label>
            <Select value={form.governorate} onValueChange={(v) => { set("governorate", v); set("area", ""); }}>
              <SelectTrigger><SelectValue placeholder="Select governorate" /></SelectTrigger>
              <SelectContent>
                {GOVERNORATES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Area</Label>
            <Select value={form.area} onValueChange={(v) => set("area", v)} disabled={!form.governorate}>
              <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
              <SelectContent>
                {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Full Address</Label>
            <Input value={form.business_full_address} onChange={(e) => set("business_full_address", e.target.value)} />
          </div>
        </div>
      )}

      {/* Step 2: Qualification */}
      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Lead Source</Label>
            <Select value={form.lead_source} onValueChange={(v) => set("lead_source", v)}>
              <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Domain Status</Label>
            <Select value={form.domain_status} onValueChange={(v) => set("domain_status", v)}>
              <SelectTrigger><SelectValue placeholder="Select domain status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Has a domain">Has a domain</SelectItem>
                <SelectItem value="Needs a domain">Needs a domain</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Timeline (days)</Label>
            <Input type="number" value={form.timeline_days} onChange={(e) => set("timeline_days", e.target.value)} />
          </div>
          <div className="space-y-2 flex flex-col justify-end gap-3 pt-4">
            <div className="flex items-center gap-2">
              <Checkbox checked={form.decision_maker_confirmed} onCheckedChange={(v) => set("decision_maker_confirmed", !!v)} />
              <Label className="cursor-pointer">Decision Maker Confirmed</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.budget_confirmed} onCheckedChange={(v) => set("budget_confirmed", !!v)} />
              <Label className="cursor-pointer">Budget Confirmed</Label>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Financials */}
      {step === 2 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Solution Selected *</Label>
            <div className="flex flex-wrap gap-3 pt-1">
              {SOLUTIONS.map((s) => (
                <label key={s} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <Checkbox checked={selectedSolutions.includes(s)} onCheckedChange={() => toggleSolution(s)} />
                  {s}
                </label>
              ))}
            </div>
            {selectedSolutions.includes("Other") && (
              <Input
                className="mt-2"
                placeholder="Please specify the solution..."
                value={otherSolutionText}
                onChange={(e) => handleOtherTextChange(e.target.value)}
                maxLength={100}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label>Add-Ons</Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {ADD_ONS.map((a) => (
                <label key={a} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <Checkbox checked={selectedAddOns.includes(a)} onCheckedChange={() => toggleAddOn(a)} />
                  {a}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Quoted Amount (KD)</Label>
            <Input type="number" step="0.001" value={form.quoted_amount_kd} onChange={(e) => set("quoted_amount_kd", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Final Agreed Amount (KD)</Label>
            <Input type="number" step="0.001" value={form.final_agreed_amount_kd} onChange={(e) => set("final_agreed_amount_kd", e.target.value)} />
          </div>
        </div>
      )}

      {/* Step 4: Delivery & Tracking */}
      {step === 3 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Follow-up Due Date</Label>
            <Input type="date" value={form.followup_due_date} onChange={(e) => set("followup_due_date", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Production Deadline</Label>
            <Input type="date" value={form.production_deadline} onChange={(e) => set("production_deadline", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Preview Sent Date</Label>
            <Input type="date" value={form.preview_sent_date} onChange={(e) => set("preview_sent_date", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Go Live Date</Label>
            <Input type="date" value={form.go_live_date} onChange={(e) => set("go_live_date", e.target.value)} />
          </div>
          <div className="space-y-3 sm:col-span-2 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {([
                ["intake_form_completed", "Intake Form Completed"],
                ["payment_link_sent", "Payment Link Sent"],
                ["payment_received", "Payment Received"],
                ["invoice_generated", "Invoice Generated"],
                ["followup_7day_completed", "7-Day Follow-up Done"],
                ["refund_cancellation", "Refund / Cancellation"],
                ["escalation_required", "Escalation Required"],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox checked={form[key] as boolean} onCheckedChange={(v) => set(key, !!v)} />
                  <Label className="text-sm cursor-pointer">{label}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Remarks</Label>
            <Textarea value={form.remarks} onChange={(e) => set("remarks", e.target.value)} rows={3} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Delivery Tracking Status</Label>
            <div className="flex gap-3 pt-1">
              {([
                { value: "Ongoing", color: "bg-orange-500 hover:bg-orange-600" },
                { value: "Closed", color: "bg-green-600 hover:bg-green-700" },
                { value: "Escalated", color: "bg-red-600 hover:bg-red-700" },
              ] as const).map(({ value, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("delivery_tracking_status", value)}
                  className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors ${color} ${
                    form.delivery_tracking_status === value ? "ring-2 ring-offset-2 ring-ring" : "opacity-60"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={step === 0 ? onClose : () => setStep(step - 1)}>
          {step === 0 ? "Cancel" : "Back"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)}>Next</Button>
        ) : (
          <Button onClick={handleSave} disabled={saving || !form.client_business_name}>
            {saving ? "Saving…" : lead ? "Update Lead" : "Create Lead"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default LeadForm;
