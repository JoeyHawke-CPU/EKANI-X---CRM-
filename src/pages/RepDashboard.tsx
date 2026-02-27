import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, TrendingUp, CheckCircle, DollarSign, AlertTriangle, Clock, Briefcase, Plus, Search, Eye, Forward, Download, MessageCircle, Mail, FileText, Receipt } from "lucide-react";
import LeadForm from "@/components/LeadForm";
import { LEAD_STATUSES } from "@/lib/constants";
import { generateInvoicePDF, generateReceiptPDF } from "@/lib/invoicePdfGenerator";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

const getDeliveryStatusColor = (status: string | null) => {
  switch (status) {
    case "Closed": return "bg-green-600 text-white";
    case "Escalated": return "bg-red-600 text-white";
    case "Ongoing":
    default: return "bg-orange-500 text-white";
  }
};

const formatLeadText = (lead: LeadRow) => {
  return `Lead #${lead.lead_id}\nClient: ${lead.client_business_name}\nContact: ${lead.client_contact_person || "—"}\nPhone: ${lead.phone_number || "—"}\nEmail: ${lead.email || "—"}\nSolution: ${lead.solution_selected || "—"}\nAmount: ${Number(lead.final_agreed_amount_kd).toFixed(3)} KD\nStatus: ${lead.status}\nDate: ${lead.date_added}`;
};

const downloadLeadCSV = (lead: LeadRow) => {
  const headers = ["Lead ID", "Client", "Contact Person", "Phone", "Email", "Solution", "Amount (KD)", "Status", "Date Added"];
  const values = [lead.lead_id, lead.client_business_name, lead.client_contact_person || "", lead.phone_number || "", lead.email || "", lead.solution_selected || "", Number(lead.final_agreed_amount_kd).toFixed(3), lead.status, lead.date_added];
  const csv = [headers.join(","), values.map((v) => `"${v}"`).join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lead-${lead.lead_id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const shareViaWhatsApp = (lead: LeadRow) => {
  const text = encodeURIComponent(formatLeadText(lead));
  window.open(`https://wa.me/?text=${text}`, "_blank");
};

const shareViaEmail = (lead: LeadRow) => {
  const subject = encodeURIComponent(`Lead #${lead.lead_id} – ${lead.client_business_name}`);
  const body = encodeURIComponent(formatLeadText(lead));
  window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
};

const quickInvoice = async (lead: LeadRow, userId: string, salesRepName?: string) => {
  const { data, error } = await supabase.from("invoices").insert({
    invoice_number: "",
    date: new Date().toISOString().split("T")[0],
    lead_id: lead.lead_id,
    client_name: lead.client_business_name,
    client_address: lead.business_full_address || null,
    description: lead.solution_selected || "Professional services",
    amount_kd: Number(lead.final_agreed_amount_kd),
    created_by: userId,
  } as any).select().single();
  if (error) { toast.error(error.message); return; }
  const doc = await generateInvoicePDF({
    invoiceNumber: (data as any).invoice_number,
    date: new Date().toISOString().split("T")[0],
    clientName: lead.client_business_name,
    clientAddress: lead.business_full_address || undefined,
    description: lead.solution_selected || "Professional services",
    amountKd: Number(lead.final_agreed_amount_kd),
    salesRepName,
  });
  doc.save(`${(data as any).invoice_number}.pdf`);
  toast.success(`Invoice ${(data as any).invoice_number} generated`);
};

const quickReceipt = async (lead: LeadRow, userId: string) => {
  const { data, error } = await supabase.from("receipts").insert({
    receipt_number: "",
    date: new Date().toISOString().split("T")[0],
    lead_id: lead.lead_id,
    client_name: lead.client_business_name,
    amount_kd: Number(lead.final_agreed_amount_kd),
    payment_method: "Cash",
    description: `Payment for ${lead.solution_selected || "services"}`,
    created_by: userId,
  } as any).select().single();
  if (error) { toast.error(error.message); return; }
  const doc = await generateReceiptPDF({
    receiptNumber: (data as any).receipt_number,
    date: new Date().toISOString().split("T")[0],
    clientName: lead.client_business_name,
    amountKd: Number(lead.final_agreed_amount_kd),
    paymentMethod: "Cash",
    description: `Payment for ${lead.solution_selected || "services"}`,
  });
  doc.save(`${(data as any).receipt_number}.pdf`);
  toast.success(`Receipt ${(data as any).receipt_number} generated`);
};

const ForwardPopover = ({ lead, size = "sm", userId, profileName }: { lead: LeadRow; size?: "sm" | "md"; userId: string; profileName?: string }) => {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const btnSize = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={btnSize} title="Forward">
          <Forward className={`${iconSize} text-muted-foreground`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1.5" align="end">
        <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-muted transition-colors" onClick={() => downloadLeadCSV(lead)}>
          <Download className="h-4 w-4 text-muted-foreground" /> Download CSV
        </button>
        <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-muted transition-colors" onClick={() => quickInvoice(lead, userId, profileName)}>
          <FileText className="h-4 w-4 text-muted-foreground" /> Generate Invoice
        </button>
        <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-muted transition-colors" onClick={() => quickReceipt(lead, userId)}>
          <Receipt className="h-4 w-4 text-muted-foreground" /> Generate Receipt
        </button>
        <hr className="my-1 border-border" />
        <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-muted transition-colors" onClick={() => shareViaWhatsApp(lead)}>
          <MessageCircle className="h-4 w-4 text-muted-foreground" /> WhatsApp
        </button>
        <button className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-muted transition-colors" onClick={() => shareViaEmail(lead)}>
          <Mail className="h-4 w-4 text-muted-foreground" /> Email
        </button>
      </PopoverContent>
    </Popover>
  );
};

const RepDashboard = () => {
  const { user, profile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editLead, setEditLead] = useState<LeadRow | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: leads = [] } = useQuery({
    queryKey: ["my-leads", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("sales_exec_id", user!.id)
        .order("date_added", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const today = new Date().toISOString().split("T")[0];
  const totalLeads = leads.length;
  const activePipeline = leads.filter((l) => l.status !== "Closed – Delivered" && l.status !== "Closed Lost").length;
  const closedDelivered = leads.filter((l) => l.status === "Closed – Delivered").length;
  const paidInProduction = leads.filter((l) => l.status === "Paid – In Production").length;
  const revenueClosed = leads.filter((l) => l.status === "Closed – Delivered").reduce((s, l) => s + Number(l.final_agreed_amount_kd || 0), 0);
  const totalCommissions = leads.reduce((s, l) => s + Number(l.commission_amount_kwd || 0), 0);
  const overdueFollowups = leads.filter((l) => l.followup_due_date && l.followup_due_date < today && l.status !== "Closed – Delivered" && l.status !== "Closed Lost");
  const dueTodayFollowups = leads.filter((l) => l.followup_due_date === today);

  const filteredLeads = leads.filter((l) => {
    const matchesSearch = !search || l.client_business_name.toLowerCase().includes(search.toLowerCase()) || (l.client_contact_person || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const kpis = [
    { label: "Total Leads", value: totalLeads, icon: Users, color: "text-primary" },
    { label: "Active Pipeline", value: activePipeline, icon: TrendingUp, color: "text-primary" },
    { label: "Closed – Delivered", value: closedDelivered, icon: CheckCircle, color: "text-primary" },
    { label: "Paid – In Production", value: paidInProduction, icon: Briefcase, color: "text-primary" },
    { label: "Revenue (KD)", value: revenueClosed.toFixed(3), icon: DollarSign, color: "text-primary" },
    { label: "Commissions (KD)", value: totalCommissions.toFixed(3), icon: DollarSign, color: "text-primary" },
    { label: "Overdue Follow-Ups", value: overdueFollowups.length, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <AppLayout>
      <div className="space-y-5 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold truncate">Dashboard</h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">Welcome back, {profile?.full_name}</p>
          </div>
          <Button onClick={() => { setEditLead(null); setShowForm(true); }} size="sm" className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Lead</span><span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* KPI Cards — horizontal scroll on mobile */}
        <div className="-mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible scrollbar-hide">
            {kpis.map((kpi) => (
              <Card key={kpi.label} className="min-w-[150px] shrink-0 md:min-w-0 md:shrink">
                <CardContent className="flex items-center gap-3 p-3 md:p-4">
                  <div className={`rounded-lg bg-muted p-2 ${kpi.color}`}>
                    <kpi.icon className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] md:text-xs font-medium text-muted-foreground whitespace-nowrap">{kpi.label}</p>
                    <p className="text-lg md:text-xl font-bold truncate">{kpi.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Follow-ups Panel */}
        {(overdueFollowups.length > 0 || dueTodayFollowups.length > 0) && (
          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                <Clock className="h-4 w-4 text-primary" /> Follow-Ups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pb-4">
              {overdueFollowups.map((l) => (
                <div key={l.lead_id} className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => { setEditLead(l); setShowForm(true); }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{l.client_business_name}</p>
                    <p className="text-xs text-muted-foreground">Due: {l.followup_due_date}</p>
                  </div>
                  <Badge variant="destructive" className="text-[10px] ml-2 shrink-0">Overdue</Badge>
                </div>
              ))}
              {dueTodayFollowups.map((l) => (
                <div key={l.lead_id} className="flex items-center justify-between rounded-lg border px-3 py-2.5 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => { setEditLead(l); setShowForm(true); }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{l.client_business_name}</p>
                    <p className="text-xs text-muted-foreground">Due today</p>
                  </div>
                  <Badge className="text-[10px] ml-2 shrink-0">Today</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* My Profile Card */}
        <Card>
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm md:text-base">My Profile</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 text-sm">
              <div><p className="text-xs text-muted-foreground">Full Name</p><p className="font-medium text-sm truncate">{profile?.full_name}</p></div>
              <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium text-sm truncate">{profile?.email}</p></div>
              <div><p className="text-xs text-muted-foreground">Civil ID</p><p className="font-medium text-sm">{profile?.civil_id || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Contact</p><p className="font-medium text-sm">{profile?.contact_number || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Date Joined</p><p className="font-medium text-sm">{profile?.date_joined}</p></div>
              <div><p className="text-xs text-muted-foreground">Commission %</p><p className="font-medium text-sm">{profile?.commission_default_percentage}%</p></div>
              <div><p className="text-xs text-muted-foreground">Clients Visited</p><p className="font-medium text-sm">{profile?.clients_visited_count}</p></div>
              <div><p className="text-xs text-muted-foreground">Clients Closed</p><p className="font-medium text-sm">{closedDelivered}</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Leads */}
        <Card>
          <CardHeader className="pb-3 px-4 pt-4">
            <div className="flex flex-col gap-3">
              <CardTitle className="text-sm md:text-base">My Leads</CardTitle>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-36 sm:w-44 shrink-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {filteredLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No leads found.</p>
            ) : (
              <>
                {/* Mobile: Card list */}
                <div className="flex flex-col gap-2.5 md:hidden">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.lead_id}
                      className="rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-sm font-medium truncate">{lead.client_business_name}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="secondary" className="text-[10px] font-normal">{lead.status}</Badge>
                          <Badge className={`text-[10px] font-normal border-0 ${getDeliveryStatusColor((lead as any).delivery_tracking_status)}`}>
                            {(lead as any).delivery_tracking_status || "Ongoing"}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditLead(lead); setShowForm(true); }}>
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <ForwardPopover lead={lead} size="sm" userId={user?.id || ""} profileName={profile?.full_name} />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>#{lead.lead_id}</span>
                        <span>{lead.date_added}</span>
                        <span className="ml-auto font-medium text-foreground">{Number(lead.final_agreed_amount_kd).toFixed(3)} KD</span>
                      </div>
                      {lead.solution_selected && (
                        <p className="text-xs text-muted-foreground mt-1">{lead.solution_selected}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop: Table */}
                <div className="hidden md:block overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 pr-4 font-medium text-muted-foreground">ID</th>
                        <th className="pb-2 pr-4 font-medium text-muted-foreground">Date</th>
                        <th className="pb-2 pr-4 font-medium text-muted-foreground">Client</th>
                        <th className="pb-2 pr-4 font-medium text-muted-foreground">Solution</th>
                        <th className="pb-2 pr-4 font-medium text-muted-foreground">Amount (KD)</th>
                        <th className="pb-2 pr-4 font-medium text-muted-foreground">Status</th>
                        <th className="pb-2 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => (
                        <tr key={lead.lead_id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2.5 pr-4">{lead.lead_id}</td>
                          <td className="py-2.5 pr-4">{lead.date_added}</td>
                          <td className="py-2.5 pr-4 font-medium">{lead.client_business_name}</td>
                          <td className="py-2.5 pr-4">{lead.solution_selected || "—"}</td>
                          <td className="py-2.5 pr-4">{Number(lead.final_agreed_amount_kd).toFixed(3)}</td>
                          <td className="py-2.5 pr-4">
                            <Badge variant="secondary" className="text-xs font-normal">{lead.status}</Badge>
                            <Badge className={`text-xs font-normal border-0 ml-1 ${getDeliveryStatusColor((lead as any).delivery_tracking_status)}`}>
                              {(lead as any).delivery_tracking_status || "Ongoing"}
                            </Badge>
                          </td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="View" onClick={() => { setEditLead(lead); setShowForm(true); }}>
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <ForwardPopover lead={lead} size="md" userId={user?.id || ""} profileName={profile?.full_name} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lead Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editLead ? "Edit Lead" : "New Lead"}</DialogTitle>
          </DialogHeader>
          <LeadForm lead={editLead} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default RepDashboard;
