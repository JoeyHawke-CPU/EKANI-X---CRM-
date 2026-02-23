import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, FileSpreadsheet } from "lucide-react";
import { downloadCSV, downloadPDF } from "@/lib/exportUtils";
import { LEAD_STATUSES, LEAD_SOURCES } from "@/lib/constants";
import type { Database } from "@/integrations/supabase/types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type RepRow = Database["public"]["Tables"]["sales_executives"]["Row"];

const AdminReports = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [repFilter, setRepFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [commissionEligibleOnly, setCommissionEligibleOnly] = useState(false);
  const [closedDeliveredOnly, setClosedDeliveredOnly] = useState(false);
  const [paidDealsOnly, setPaidDealsOnly] = useState(false);

  const { data: leads = [] } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("date_added", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: reps = [] } = useQuery({
    queryKey: ["admin-reps"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales_executives").select("*").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const repMap = useMemo(() => {
    const m: Record<string, string> = {};
    reps.forEach((r) => { m[r.user_id] = r.full_name; });
    return m;
  }, [reps]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (dateFrom && l.date_added < dateFrom) return false;
      if (dateTo && l.date_added > dateTo) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (sourceFilter !== "all" && l.lead_source !== sourceFilter) return false;
      if (repFilter !== "all" && l.sales_exec_id !== repFilter) return false;
      if (paymentFilter === "paid" && !l.payment_received) return false;
      if (paymentFilter === "unpaid" && l.payment_received) return false;
      if (commissionEligibleOnly && !l.commission_eligible) return false;
      if (closedDeliveredOnly && l.status !== "Closed – Delivered") return false;
      if (paidDealsOnly && !l.payment_received) return false;
      return true;
    });
  }, [leads, dateFrom, dateTo, statusFilter, sourceFilter, repFilter, paymentFilter, commissionEligibleOnly, closedDeliveredOnly, paidDealsOnly]);

  const dateRange = [dateFrom, dateTo].filter(Boolean).join(" – ") || "All time";
  const totalRevenue = filtered.filter((l) => l.status === "Closed – Delivered").reduce((s, l) => s + Number(l.final_agreed_amount_kd || 0), 0);
  const totalCommission = filtered.reduce((s, l) => s + Number(l.commission_amount_kwd || 0), 0);

  // ---- Global Sales Performance ----
  const exportGlobalPDF = () => {
    const salesReps = reps.filter((r) => r.role !== "admin");
    const headers = ["Rep", "Leads", "Closed", "Revenue (KD)", "Commission (KD)", "Conv %"];
    const rows = salesReps.map((rep) => {
      const rl = filtered.filter((l) => l.sales_exec_id === rep.user_id);
      const closed = rl.filter((l) => l.status === "Closed – Delivered");
      const rev = closed.reduce((s, l) => s + Number(l.final_agreed_amount_kd || 0), 0);
      const comm = rl.reduce((s, l) => s + Number(l.commission_amount_kwd || 0), 0);
      const conv = rl.length > 0 ? ((closed.length / rl.length) * 100).toFixed(1) : "0";
      return [rep.full_name, String(rl.length), String(closed.length), rev.toFixed(3), comm.toFixed(3), `${conv}%`];
    });
    downloadPDF({
      title: "Global Sales Performance Report",
      subtitle: dateRange,
      summaryRows: [
        { label: "Total Leads", value: String(filtered.length) },
        { label: "Total Revenue (KD)", value: totalRevenue.toFixed(3) },
        { label: "Total Commission (KD)", value: totalCommission.toFixed(3) },
      ],
      tableHeaders: headers,
      tableRows: rows,
      filename: `global_performance_${new Date().toISOString().split("T")[0]}.pdf`,
    });
  };

  const exportGlobalCSV = () => {
    const salesReps = reps.filter((r) => r.role !== "admin");
    const headers = ["Rep", "Email", "Leads", "Closed", "Revenue (KD)", "Commission (KD)", "Conversion %"];
    const rows = salesReps.map((rep) => {
      const rl = filtered.filter((l) => l.sales_exec_id === rep.user_id);
      const closed = rl.filter((l) => l.status === "Closed – Delivered");
      const rev = closed.reduce((s, l) => s + Number(l.final_agreed_amount_kd || 0), 0);
      const comm = rl.reduce((s, l) => s + Number(l.commission_amount_kwd || 0), 0);
      const conv = rl.length > 0 ? ((closed.length / rl.length) * 100).toFixed(1) : "0";
      return [rep.full_name, rep.email, String(rl.length), String(closed.length), rev.toFixed(3), comm.toFixed(3), conv];
    });
    downloadCSV(`global_performance_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
  };

  // ---- Commission Payout ----
  const commissionLeads = useMemo(() => {
    return filtered.filter((l) => l.payment_received && l.commission_eligible);
  }, [filtered]);

  const exportCommissionPDF = () => {
    const headers = ["Rep", "Lead ID", "Client", "Date", "Final (KD)", "Comm %", "Commission (KD)", "Status"];
    const rows = commissionLeads.map((l) => [
      repMap[l.sales_exec_id] || "—",
      String(l.lead_id),
      l.client_business_name,
      l.date_added,
      Number(l.final_agreed_amount_kd).toFixed(3),
      String(l.commission_percentage),
      Number(l.commission_amount_kwd || 0).toFixed(3),
      l.status,
    ]);
    const totalComm = commissionLeads.reduce((s, l) => s + Number(l.commission_amount_kwd || 0), 0);
    downloadPDF({
      title: "Commission Payout Report",
      subtitle: dateRange,
      summaryRows: [
        { label: "Eligible Deals", value: String(commissionLeads.length) },
        { label: "Total Payout (KD)", value: totalComm.toFixed(3) },
      ],
      tableHeaders: headers,
      tableRows: rows,
      filename: `commission_payout_${new Date().toISOString().split("T")[0]}.pdf`,
    });
  };

  const exportCommissionCSV = () => {
    const headers = ["Rep", "Email", "Lead ID", "Client", "Date", "Final Amount (KD)", "Commission %", "Commission (KD)", "Status", "Go-Live Date"];
    const rows = commissionLeads.map((l) => {
      const rep = reps.find((r) => r.user_id === l.sales_exec_id);
      return [
        rep?.full_name || "—", rep?.email || "—",
        String(l.lead_id), l.client_business_name, l.date_added,
        Number(l.final_agreed_amount_kd).toFixed(3), String(l.commission_percentage),
        Number(l.commission_amount_kwd || 0).toFixed(3), l.status, l.go_live_date || "",
      ];
    });
    downloadCSV(`commission_payout_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
  };

  // ---- Full Master Export ----
  const exportMasterCSV = () => {
    const headers = [
      "Lead ID", "Date Added", "Rep", "Client", "Contact Person", "Phone", "WhatsApp", "Email",
      "Governorate", "Area", "Address", "Lead Source", "Domain Status", "Decision Maker", "Budget Confirmed",
      "Timeline Days", "Solution", "Add-Ons", "Quoted (KD)", "Final (KD)", "Commission %", "Commission (KD)",
      "Commission Eligible", "Status", "Payment Received", "Invoice Generated", "Intake Form",
      "Payment Link Sent", "Production Deadline", "Preview Sent", "Go-Live", "7-Day Follow-Up",
      "Follow-Up Due", "Escalation", "Refund/Cancel", "Days to Close", "Remarks",
    ];
    const rows = filtered.map((l) => [
      String(l.lead_id), l.date_added, repMap[l.sales_exec_id] || "—",
      l.client_business_name, l.client_contact_person || "", l.phone_number || "",
      l.whatsapp_number || "", l.email || "", l.governorate || "", l.area || "",
      l.business_full_address || "", l.lead_source || "", l.domain_status || "",
      l.decision_maker_confirmed ? "Yes" : "No", l.budget_confirmed ? "Yes" : "No",
      String(l.timeline_days ?? ""), l.solution_selected || "", l.add_ons || "",
      Number(l.quoted_amount_kd).toFixed(3), Number(l.final_agreed_amount_kd).toFixed(3),
      String(l.commission_percentage), Number(l.commission_amount_kwd || 0).toFixed(3),
      l.commission_eligible ? "Yes" : "No", l.status,
      l.payment_received ? "Yes" : "No", l.invoice_generated ? "Yes" : "No",
      l.intake_form_completed ? "Yes" : "No", l.payment_link_sent ? "Yes" : "No",
      l.production_deadline || "", l.preview_sent_date || "", l.go_live_date || "",
      l.followup_7day_completed ? "Yes" : "No", l.followup_due_date || "",
      l.escalation_required ? "Yes" : "No", l.refund_cancellation ? "Yes" : "No",
      String(l.days_to_close ?? ""), l.remarks || "",
    ]);
    downloadCSV(`crm_master_export_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Export company-wide sales data</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="space-y-1.5">
                <Label className="text-xs">Date From</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date To</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Rep</Label>
                <Select value={repFilter} onValueChange={setRepFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reps</SelectItem>
                    {reps.filter((r) => r.role !== "admin").map((r) => (
                      <SelectItem key={r.user_id} value={r.user_id}>{r.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Lead Source</Label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Payment</Label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 pt-1">
              <div className="flex items-center gap-2">
                <Switch checked={commissionEligibleOnly} onCheckedChange={setCommissionEligibleOnly} />
                <Label className="text-xs">Commission Eligible Only</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={paidDealsOnly} onCheckedChange={setPaidDealsOnly} />
                <Label className="text-xs">Paid Deals Only</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={closedDeliveredOnly} onCheckedChange={setClosedDeliveredOnly} />
                <Label className="text-xs">Closed Delivered Only</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Global Sales Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Per-rep performance summary. {filtered.length} leads match.</p>
              <div className="flex gap-2">
                <Button onClick={exportGlobalPDF} className="gap-2" size="sm">
                  <FileText className="h-4 w-4" /> PDF
                </Button>
                <Button onClick={exportGlobalCSV} variant="outline" className="gap-2" size="sm">
                  <FileSpreadsheet className="h-4 w-4" /> CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Commission Payout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Paid + eligible deals. {commissionLeads.length} qualifying.</p>
              <div className="flex gap-2">
                <Button onClick={exportCommissionPDF} className="gap-2" size="sm">
                  <FileText className="h-4 w-4" /> PDF
                </Button>
                <Button onClick={exportCommissionCSV} variant="outline" className="gap-2" size="sm">
                  <FileSpreadsheet className="h-4 w-4" /> CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Full CRM Master Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Every column, no restrictions. {filtered.length} leads.</p>
              <div className="flex gap-2">
                <Button onClick={exportMasterCSV} variant="outline" className="gap-2" size="sm">
                  <FileSpreadsheet className="h-4 w-4" /> CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminReports;
