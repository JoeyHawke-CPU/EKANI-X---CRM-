import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Receipt, Plus, Download, MessageCircle, Mail, Search } from "lucide-react";
import { generateInvoicePDF, generateReceiptPDF } from "@/lib/invoicePdfGenerator";

const InvoicesReceipts = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [search, setSearch] = useState("");

  // Fetch leads for the client dropdown
  const { data: leads = [] } = useQuery({
    queryKey: ["leads-for-invoices", user?.id, role],
    queryFn: async () => {
      const query = supabase.from("leads").select("lead_id, client_business_name, client_contact_person, email, whatsapp_number, final_agreed_amount_kd, business_full_address, solution_selected");
      if (role !== "admin") {
        query.eq("sales_exec_id", user!.id);
      }
      const { data, error } = await query.order("client_business_name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch invoices
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch receipts
  const { data: receipts = [] } = useQuery({
    queryKey: ["receipts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filteredInvoices = invoices.filter((inv: any) =>
    !search || inv.client_name?.toLowerCase().includes(search.toLowerCase()) || inv.invoice_number?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredReceipts = receipts.filter((rec: any) =>
    !search || rec.client_name?.toLowerCase().includes(search.toLowerCase()) || rec.receipt_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Invoices & Receipts</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Generate and manage professional documents</p>
          </div>
        </div>

        <Tabs defaultValue="invoices" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="invoices" className="gap-1.5">
                <FileText className="h-4 w-4" /> Invoices
              </TabsTrigger>
              <TabsTrigger value="receipts" className="gap-1.5">
                <Receipt className="h-4 w-4" /> Receipts
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
            </div>
          </div>

          <TabsContent value="invoices" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" className="gap-1.5" onClick={() => setShowInvoiceForm(true)}>
                <Plus className="h-4 w-4" /> New Invoice
              </Button>
            </div>
            <DocumentList
              items={filteredInvoices}
              type="invoice"
              leads={leads}
            />
          </TabsContent>

          <TabsContent value="receipts" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" className="gap-1.5" onClick={() => setShowReceiptForm(true)}>
                <Plus className="h-4 w-4" /> New Receipt
              </Button>
            </div>
            <DocumentList
              items={filteredReceipts}
              type="receipt"
              leads={leads}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Invoice Form Dialog */}
      <Dialog open={showInvoiceForm} onOpenChange={setShowInvoiceForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <InvoiceForm
            leads={leads}
            userId={user?.id || ""}
            onSuccess={() => {
              setShowInvoiceForm(false);
              queryClient.invalidateQueries({ queryKey: ["invoices"] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Receipt Form Dialog */}
      <Dialog open={showReceiptForm} onOpenChange={setShowReceiptForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Receipt Voucher</DialogTitle>
          </DialogHeader>
          <ReceiptForm
            leads={leads}
            userId={user?.id || ""}
            onSuccess={() => {
              setShowReceiptForm(false);
              queryClient.invalidateQueries({ queryKey: ["receipts"] });
            }}
          />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

// ---------- Document List ----------
function DocumentList({ items, type, leads }: { items: any[]; type: "invoice" | "receipt"; leads: any[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No {type}s generated yet.
        </CardContent>
      </Card>
    );
  }

  const handleDownload = (item: any) => {
    if (type === "invoice") {
      const doc = generateInvoicePDF({
        invoiceNumber: item.invoice_number,
        date: item.date,
        clientName: item.client_name,
        clientAddress: item.client_address,
        description: item.description,
        amountKd: Number(item.amount_kd),
        paymentTerms: item.payment_terms,
        notes: item.notes,
      });
      doc.save(`${item.invoice_number}.pdf`);
    } else {
      const doc = generateReceiptPDF({
        receiptNumber: item.receipt_number,
        date: item.date,
        clientName: item.client_name,
        amountKd: Number(item.amount_kd),
        paymentMethod: item.payment_method,
        chequeReference: item.cheque_reference,
        bankName: item.bank_name,
        description: item.description,
      });
      doc.save(`${item.receipt_number}.pdf`);
    }
    toast.success("PDF downloaded");
  };

  const handleWhatsApp = (item: any) => {
    // Auto-download the PDF first so the user can attach it
    handleDownload(item);

    const lead = leads.find((l: any) => l.lead_id === item.lead_id);
    const number = lead?.whatsapp_number?.replace(/[^0-9]/g, "") || "";
    const docNum = type === "invoice" ? item.invoice_number : item.receipt_number;
    const text = encodeURIComponent(
      `Dear ${item.client_name},\n\nPlease find attached your ${type} ${docNum} for KD ${Number(item.amount_kd).toFixed(3)}.\n\nThank you,\nEKANI AI Consultancy`
    );
    const url = number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;

    // Small delay so the PDF download starts before opening WhatsApp
    setTimeout(() => {
      window.open(url, "_blank");
      toast.info("PDF downloaded — please attach it to your WhatsApp message");
    }, 500);
  };

  const handleEmail = (item: any) => {
    const lead = leads.find((l: any) => l.lead_id === item.lead_id);
    const email = lead?.email || "";
    const docNum = type === "invoice" ? item.invoice_number : item.receipt_number;
    const subject = encodeURIComponent(`${type === "invoice" ? "Invoice" : "Receipt"} ${docNum} – EKANI AI Consultancy`);
    const body = encodeURIComponent(
      `Dear ${item.client_name},\n\nPlease find your ${type} ${docNum} for KD ${Number(item.amount_kd).toFixed(3)}.\n\nThank you,\nEKANI AI Consultancy`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {items.map((item: any) => {
            const num = type === "invoice" ? item.invoice_number : item.receipt_number;
            return (
              <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{num}</p>
                    <Badge variant="secondary" className="text-[10px]">{item.date}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.client_name} · KD {Number(item.amount_kd).toFixed(3)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Download PDF" onClick={() => handleDownload(item)}>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Send via WhatsApp" onClick={() => handleWhatsApp(item)}>
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Send via Email" onClick={() => handleEmail(item)}>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Invoice Form ----------
function InvoiceForm({ leads, userId, onSuccess }: { leads: any[]; userId: string; onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [form, setForm] = useState({
    client_name: "",
    client_address: "",
    description: "",
    amount_kd: "",
    payment_terms: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleLeadSelect = (leadId: string) => {
    setSelectedLeadId(leadId);
    const lead = leads.find((l: any) => l.lead_id === Number(leadId));
    if (lead) {
      setForm((p) => ({
        ...p,
        client_name: lead.client_business_name,
        client_address: lead.business_full_address || "",
        amount_kd: Number(lead.final_agreed_amount_kd).toString(),
        description: lead.solution_selected || "",
      }));
    }
  };

  const handleSubmit = async () => {
    if (!form.client_name || !form.description || !form.amount_kd) {
      toast.error("Please fill in client name, description, and amount");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.from("invoices").insert({
      invoice_number: "", // trigger will auto-generate
      date: form.date,
      lead_id: selectedLeadId ? Number(selectedLeadId) : null,
      client_name: form.client_name,
      client_address: form.client_address || null,
      description: form.description,
      amount_kd: parseFloat(form.amount_kd),
      payment_terms: form.payment_terms || null,
      notes: form.notes || null,
      created_by: userId,
    } as any).select().single();

    if (error) {
      toast.error(error.message);
    } else {
      // Generate and download PDF
      const doc = generateInvoicePDF({
        invoiceNumber: (data as any).invoice_number,
        date: form.date,
        clientName: form.client_name,
        clientAddress: form.client_address,
        description: form.description,
        amountKd: parseFloat(form.amount_kd),
        paymentTerms: form.payment_terms,
        notes: form.notes,
      });
      doc.save(`${(data as any).invoice_number}.pdf`);
      toast.success(`Invoice ${(data as any).invoice_number} created and downloaded`);
      onSuccess();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select Client (from leads)</Label>
        <Select value={selectedLeadId} onValueChange={handleLeadSelect}>
          <SelectTrigger><SelectValue placeholder="Select a client…" /></SelectTrigger>
          <SelectContent>
            {leads.map((l: any) => (
              <SelectItem key={l.lead_id} value={String(l.lead_id)}>
                {l.client_business_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Client Name *</Label>
          <Input value={form.client_name} onChange={(e) => set("client_name", e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Client Address</Label>
          <Input value={form.client_address} onChange={(e) => set("client_address", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Amount (KD) *</Label>
          <Input type="number" step="0.001" value={form.amount_kd} onChange={(e) => set("amount_kd", e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Service / Product Description *</Label>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Payment Terms</Label>
          <Input value={form.payment_terms} onChange={(e) => set("payment_terms", e.target.value)} placeholder="e.g. Net 30 days" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? "Generating…" : "Generate Invoice & Download PDF"}
        </Button>
      </div>
    </div>
  );
}

// ---------- Receipt Form ----------
function ReceiptForm({ leads, userId, onSuccess }: { leads: any[]; userId: string; onSuccess: () => void }) {
  const [saving, setSaving] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [form, setForm] = useState({
    client_name: "",
    amount_kd: "",
    payment_method: "Cash",
    cheque_reference: "",
    bank_name: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleLeadSelect = (leadId: string) => {
    setSelectedLeadId(leadId);
    const lead = leads.find((l: any) => l.lead_id === Number(leadId));
    if (lead) {
      setForm((p) => ({
        ...p,
        client_name: lead.client_business_name,
        amount_kd: Number(lead.final_agreed_amount_kd).toString(),
        description: `Payment for ${lead.solution_selected || "services"}`,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!form.client_name || !form.amount_kd || !form.description) {
      toast.error("Please fill in client name, amount, and description");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.from("receipts").insert({
      receipt_number: "", // trigger will auto-generate
      date: form.date,
      lead_id: selectedLeadId ? Number(selectedLeadId) : null,
      client_name: form.client_name,
      amount_kd: parseFloat(form.amount_kd),
      payment_method: form.payment_method,
      cheque_reference: form.cheque_reference || null,
      bank_name: form.bank_name || null,
      description: form.description,
      created_by: userId,
    } as any).select().single();

    if (error) {
      toast.error(error.message);
    } else {
      const doc = generateReceiptPDF({
        receiptNumber: (data as any).receipt_number,
        date: form.date,
        clientName: form.client_name,
        amountKd: parseFloat(form.amount_kd),
        paymentMethod: form.payment_method,
        chequeReference: form.cheque_reference,
        bankName: form.bank_name,
        description: form.description,
      });
      doc.save(`${(data as any).receipt_number}.pdf`);
      toast.success(`Receipt ${(data as any).receipt_number} created and downloaded`);
      onSuccess();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select Client (from leads)</Label>
        <Select value={selectedLeadId} onValueChange={handleLeadSelect}>
          <SelectTrigger><SelectValue placeholder="Select a client…" /></SelectTrigger>
          <SelectContent>
            {leads.map((l: any) => (
              <SelectItem key={l.lead_id} value={String(l.lead_id)}>
                {l.client_business_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Client Name (Mr./M/s) *</Label>
          <Input value={form.client_name} onChange={(e) => set("client_name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Amount (KD) *</Label>
          <Input type="number" step="0.001" value={form.amount_kd} onChange={(e) => set("amount_kd", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <Select value={form.payment_method} onValueChange={(v) => set("payment_method", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Cheque">Cheque</SelectItem>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              <SelectItem value="Online Payment">Online Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(form.payment_method === "Cheque" || form.payment_method === "Bank Transfer") && (
          <>
            <div className="space-y-2">
              <Label>{form.payment_method === "Cheque" ? "Cheque Reference No." : "Transfer Reference"}</Label>
              <Input value={form.cheque_reference} onChange={(e) => set("cheque_reference", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input value={form.bank_name} onChange={(e) => set("bank_name", e.target.value)} />
            </div>
          </>
        )}
        <div className="space-y-2 sm:col-span-2">
          <Label>Description / Purpose of Payment *</Label>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? "Generating…" : "Generate Receipt & Download PDF"}
        </Button>
      </div>
    </div>
  );
}

export default InvoicesReceipts;
