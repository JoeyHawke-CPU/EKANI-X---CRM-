import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, FileSpreadsheet } from "lucide-react";
import { downloadCSV, downloadPDF } from "@/lib/exportUtils";
import { LEAD_STATUSES, SOLUTIONS, LEAD_SOURCES } from "@/lib/constants";
import type { Database } from "@/integrations/supabase/types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

const RepReports = () => {
  const { user, profile } = useAuth();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [solutionFilter, setSolutionFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

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

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (dateFrom && l.date_added < dateFrom) return false;
      if (dateTo && l.date_added > dateTo) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (solutionFilter !== "all" && l.solution_selected !== solutionFilter) return false;
      if (sourceFilter !== "all" && l.lead_source !== sourceFilter) return false;
      if (paymentFilter === "paid" && !l.payment_received) return false;
      if (paymentFilter === "unpaid" && l.payment_received) return false;
      return true;
    });
  }, [leads, dateFrom, dateTo, statusFilter, solutionFilter, sourceFilter, paymentFilter]);

  const closedDelivered = filtered.filter((l) => l.status === "Closed – Delivered");
  const totalRevenue = closedDelivered.reduce((s, l) => s + Number(l.final_agreed_amount_kd || 0), 0);
  const totalCommission = filtered.reduce((s, l) => s + Number(l.commission_amount_kwd || 0), 0);

  const dateRange = [dateFrom, dateTo].filter(Boolean).join(" – ") || "All time";

  const exportPerformancePDF = () => {
    const headers = ["Lead ID", "Date", "Client", "Source", "Solution", "Amount (KD)", "Status", "Payment", "Commission (KD)"];
    const rows = filtered.map((l) => [
      String(l.lead_id),
      l.date_added,
      l.client_business_name,
      l.lead_source || "—",
      l.solution_selected || "—",
      Number(l.final_agreed_amount_kd).toFixed(3),
      l.status,
      l.payment_received ? "Yes" : "No",
      Number(l.commission_amount_kwd || 0).toFixed(3),
    ]);
    downloadPDF({
      title: "Performance Summary Report",
      subtitle: `${profile?.full_name} · ${dateRange}`,
      summaryRows: [
        { label: "Total Leads", value: String(filtered.length) },
        { label: "Closed Delivered", value: String(closedDelivered.length) },
        { label: "Revenue (KD)", value: totalRevenue.toFixed(3) },
        { label: "Total Commission (KD)", value: totalCommission.toFixed(3) },
      ],
      tableHeaders: headers,
      tableRows: rows,
      filename: `performance_summary_${new Date().toISOString().split("T")[0]}.pdf`,
    });
  };

  const exportPerformanceCSV = () => {
    const headers = ["Lead ID", "Date", "Client", "Source", "Solution", "Amount (KD)", "Status", "Payment", "Commission (KD)"];
    const rows = filtered.map((l) => [
      String(l.lead_id),
      l.date_added,
      l.client_business_name,
      l.lead_source || "",
      l.solution_selected || "",
      Number(l.final_agreed_amount_kd).toFixed(3),
      l.status,
      l.payment_received ? "Yes" : "No",
      Number(l.commission_amount_kwd || 0).toFixed(3),
    ]);
    downloadCSV(`performance_summary_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
  };

  const exportDetailedCSV = () => {
    const headers = [
      "Lead ID", "Date Added", "Client", "Contact Person", "Phone", "WhatsApp", "Email",
      "Governorate", "Area", "Address", "Lead Source", "Domain Status", "Solution",
      "Add-Ons", "Quoted (KD)", "Final (KD)", "Commission %", "Commission (KD)",
      "Status", "Payment Received", "Invoice Generated", "Intake Form", "Follow-Up Due",
      "Production Deadline", "Preview Sent", "Go-Live", "Remarks",
    ];
    const rows = filtered.map((l) => [
      String(l.lead_id), l.date_added, l.client_business_name, l.client_contact_person || "",
      l.phone_number || "", l.whatsapp_number || "", l.email || "",
      l.governorate || "", l.area || "", l.business_full_address || "",
      l.lead_source || "", l.domain_status || "", l.solution_selected || "",
      l.add_ons || "", Number(l.quoted_amount_kd).toFixed(3), Number(l.final_agreed_amount_kd).toFixed(3),
      String(l.commission_percentage), Number(l.commission_amount_kwd || 0).toFixed(3),
      l.status, l.payment_received ? "Yes" : "No", l.invoice_generated ? "Yes" : "No",
      l.intake_form_completed ? "Yes" : "No", l.followup_due_date || "",
      l.production_deadline || "", l.preview_sent_date || "", l.go_live_date || "", l.remarks || "",
    ]);
    downloadCSV(`crm_export_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Export your sales data</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
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
                <Label className="text-xs">Solution</Label>
                <Select value={solutionFilter} onValueChange={setSolutionFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {SOLUTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
          </CardContent>
        </Card>

        {/* Export Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Performance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                KPI summary + deal table. {filtered.length} leads match filters.
              </div>
              <div className="flex gap-2">
                <Button onClick={exportPerformancePDF} className="gap-2" size="sm">
                  <FileText className="h-4 w-4" /> PDF
                </Button>
                <Button onClick={exportPerformanceCSV} variant="outline" className="gap-2" size="sm">
                  <FileSpreadsheet className="h-4 w-4" /> CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Detailed CRM Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                All lead columns (no internal timestamps). {filtered.length} leads match filters.
              </div>
              <div className="flex gap-2">
                <Button onClick={exportDetailedCSV} variant="outline" className="gap-2" size="sm">
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

export default RepReports;
