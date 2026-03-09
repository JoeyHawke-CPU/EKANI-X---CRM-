import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Edit2, Trash2, Eye, Download, FileText, FileSpreadsheet, ClipboardList } from "lucide-react";
import { downloadCSV, downloadPDF } from "@/lib/exportUtils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import LeadForm from "@/components/LeadForm";
import type { Database } from "@/integrations/supabase/types";

type RepRow = Database["public"]["Tables"]["sales_executives"]["Row"];
type LeadRow = Database["public"]["Tables"]["leads"]["Row"];


const AdminReps = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editRep, setEditRep] = useState<RepRow | null>(null);
  const [viewLeadsRep, setViewLeadsRep] = useState<RepRow | null>(null);
  const [editLead, setEditLead] = useState<LeadRow | null>(null);

  const { data: reps = [] } = useQuery({
    queryKey: ["admin-reps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_executives")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*");
      if (error) throw error;
      return data;
    },
  });

  const updateRep = useMutation({
    mutationFn: async (updates: Partial<RepRow> & { user_id: string }) => {
      const { user_id, ...rest } = updates;
      const { error } = await supabase
        .from("sales_executives")
        .update(rest)
        .eq("user_id", user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reps"] });
      setEditRep(null);
      toast({ title: "Rep updated successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteRep = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("sales_executives")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reps"] });
      toast({ title: "Rep deleted successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const filtered = reps.filter(
    (r) =>
      r.role !== "admin" &&
      (!search ||
        r.full_name.toLowerCase().includes(search.toLowerCase()) ||
        r.email.toLowerCase().includes(search.toLowerCase()))
  );

  const getRepStats = (rep: RepRow) => {
    const repLeads = leads.filter((l) => l.sales_exec_id === rep.user_id);
    const closed = repLeads.filter((l) => l.status === "Closed – Delivered").length;
    const revenue = repLeads
      .filter((l) => l.status === "Closed – Delivered")
      .reduce((s, l) => s + Number(l.final_agreed_amount_kd || 0), 0);
    return { total: repLeads.length, closed, revenue };
  };

  const exportRepPDF = (rep: RepRow) => {
    const repLeads = leads.filter((l) => l.sales_exec_id === rep.user_id);
    const closedDelivered = repLeads.filter((l) => l.status === "Closed – Delivered");
    const totalRevenue = closedDelivered.reduce((s, l) => s + Number(l.final_agreed_amount_kd || 0), 0);
    const totalCommission = repLeads.reduce((s, l) => s + Number(l.commission_amount_kwd || 0), 0);
    const conv = repLeads.length > 0 ? ((closedDelivered.length / repLeads.length) * 100).toFixed(1) : "0";
    const headers = ["Lead ID", "Date", "Client", "Source", "Solution", "Amount (KD)", "Status", "Payment", "Commission (KD)"];
    const rows = repLeads.map((l) => [
      String(l.lead_id), l.date_added, l.client_business_name, l.lead_source || "—",
      l.solution_selected || "—", Number(l.final_agreed_amount_kd).toFixed(3), l.status,
      l.payment_received ? "Yes" : "No", Number(l.commission_amount_kwd || 0).toFixed(3),
    ]);
    downloadPDF({
      title: `Sales Report — ${rep.full_name}`,
      subtitle: `Generated ${new Date().toLocaleDateString()}`,
      summaryRows: [
        { label: "Total Leads", value: String(repLeads.length) },
        { label: "Closed Delivered", value: String(closedDelivered.length) },
        { label: "Conversion Rate", value: `${conv}%` },
        { label: "Revenue (KD)", value: totalRevenue.toFixed(3) },
        { label: "Total Commission (KD)", value: totalCommission.toFixed(3) },
      ],
      tableHeaders: headers,
      tableRows: rows,
      filename: `${rep.full_name.replace(/\s+/g, "_")}_report_${new Date().toISOString().split("T")[0]}.pdf`,
    });
  };

  const exportRepCSV = (rep: RepRow) => {
    const repLeads = leads.filter((l) => l.sales_exec_id === rep.user_id);
    const headers = [
      "Lead ID", "Date Added", "Client", "Contact Person", "Phone", "WhatsApp", "Email",
      "Governorate", "Area", "Address", "Lead Source", "Domain Status", "Solution",
      "Add-Ons", "Quoted (KD)", "Final (KD)", "Commission %", "Commission (KD)",
      "Status", "Payment Received", "Invoice Generated", "Intake Form", "Follow-Up Due",
      "Production Deadline", "Preview Sent", "Go-Live", "Remarks",
    ];
    const rows = repLeads.map((l) => [
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
    downloadCSV(`${rep.full_name.replace(/\s+/g, "_")}_report_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sales Reps</h1>
            <p className="text-sm text-muted-foreground">
              {reps.length} reps · {reps.filter((r) => r.active_status).length} active
            </p>
          </div>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reps…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((rep) => {
            const stats = getRepStats(rep);
            return (
              <Card key={rep.user_id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{rep.full_name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{rep.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rep.active_status ? "default" : "secondary"} className="text-xs">
                        {rep.active_status ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditRep(rep)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {rep.full_name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove this sales rep. Any leads assigned to them will remain but become unlinked. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => deleteRep.mutate(rep.user_id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Role</p>
                      <p className="font-medium capitalize">{rep.role}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Commission %</p>
                      <p className="font-medium">{rep.commission_default_percentage}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Date Joined</p>
                      <p className="font-medium">{rep.date_joined}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Contact</p>
                      <p className="font-medium">{rep.contact_number || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Civil ID</p>
                      <p className="font-medium">{rep.civil_id || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Clients Visited</p>
                      <p className="font-medium">{rep.clients_visited_count}</p>
                    </div>
                  </div>
                  <div className="border-t pt-3 grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <p className="text-lg font-bold">{stats.total}</p>
                      <p className="text-xs text-muted-foreground">Leads</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{stats.closed}</p>
                      <p className="text-xs text-muted-foreground">Closed</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{stats.revenue.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Revenue (KD)</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => setViewLeadsRep(rep)}
                    >
                      <Eye className="h-3.5 w-3.5" /> View Leads
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="h-3.5 w-3.5" /> Report
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => exportRepPDF(rep)}>
                          <FileText className="h-4 w-4 mr-2" /> Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportRepCSV(rep)}>
                          <FileSpreadsheet className="h-4 w-4 mr-2" /> Download CSV
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Edit Rep Dialog */}
      {editRep && (
        <Dialog open={!!editRep} onOpenChange={() => setEditRep(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Rep — {editRep.full_name}</DialogTitle>
            </DialogHeader>
            <EditRepForm
              rep={editRep}
              onSave={(updates) =>
                updateRep.mutate({ user_id: editRep.user_id, ...updates })
              }
              saving={updateRep.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* View Rep Leads Dialog */}
      {viewLeadsRep && (
        <Dialog open={!!viewLeadsRep} onOpenChange={() => setViewLeadsRep(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewLeadsRep.full_name}'s Leads</DialogTitle>
            </DialogHeader>
            {(() => {
              const repLeads = leads.filter((l) => l.sales_exec_id === viewLeadsRep.user_id);
              if (repLeads.length === 0) {
                return <p className="text-sm text-muted-foreground py-6 text-center">No leads assigned.</p>;
              }
              return (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 pr-4 font-medium text-muted-foreground">ID</th>
                        <th className="pb-2 pr-4 font-medium text-muted-foreground">Date</th>
                        <th className="pb-2 pr-4 font-medium text-muted-foreground">Client</th>
                        <th className="pb-2 pr-4 font-medium text-muted-foreground">Solution</th>
                        <th className="pb-2 pr-4 font-medium text-muted-foreground">Amount (KD)</th>
                        <th className="pb-2 pr-4 font-medium text-muted-foreground">Status</th>
                        <th className="pb-2 font-medium text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repLeads.map((lead) => (
                        <tr key={lead.lead_id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2.5 pr-4">{lead.lead_id}</td>
                          <td className="py-2.5 pr-4">{lead.date_added}</td>
                          <td className="py-2.5 pr-4 font-medium">{lead.client_business_name}</td>
                          <td className="py-2.5 pr-4">{lead.solution_selected || "—"}</td>
                          <td className="py-2.5 pr-4">{Number(lead.final_agreed_amount_kd).toFixed(3)}</td>
                          <td className="py-2.5 pr-4">
                            <Badge variant="secondary" className="text-xs font-normal">{lead.status}</Badge>
                          </td>
                          <td className="py-2.5">
                            <Button variant="ghost" size="sm" className="gap-1.5 h-7" onClick={() => setEditLead(lead)}>
                              <Eye className="h-3.5 w-3.5" /> View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}

      {/* Lead Form Dialog (admin view/edit) */}
      {editLead && (
        <Dialog open={!!editLead} onOpenChange={() => setEditLead(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lead #{editLead.lead_id} — {editLead.client_business_name}</DialogTitle>
            </DialogHeader>
            <LeadForm lead={editLead} onClose={() => { setEditLead(null); queryClient.invalidateQueries({ queryKey: ["admin-leads"] }); }} />
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
};

function EditRepForm({
  rep,
  onSave,
  saving,
}: {
  rep: RepRow;
  onSave: (u: Partial<RepRow>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<{
    full_name: string;
    contact_number: string;
    civil_id: string;
    commission_default_percentage: number;
    clients_visited_count: number;
    active_status: boolean;
    role: "sales" | "admin";
  }>({
    full_name: rep.full_name,
    contact_number: rep.contact_number || "",
    civil_id: rep.civil_id || "",
    commission_default_percentage: rep.commission_default_percentage,
    clients_visited_count: rep.clients_visited_count,
    active_status: rep.active_status,
    role: rep.role,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Full Name</Label>
        <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Contact Number</Label>
          <Input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Civil ID</Label>
          <Input value={form.civil_id} onChange={(e) => setForm({ ...form, civil_id: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Commission %</Label>
          <Input
            type="number"
            value={form.commission_default_percentage}
            onChange={(e) => setForm({ ...form, commission_default_percentage: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Clients Visited</Label>
          <Input
            type="number"
            value={form.clients_visited_count}
            onChange={(e) => setForm({ ...form, clients_visited_count: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={form.role} onValueChange={(v: "sales" | "admin") => setForm({ ...form, role: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={form.active_status} onCheckedChange={(v) => setForm({ ...form, active_status: v })} />
        <Label>Active</Label>
      </div>
      <Button className="w-full" onClick={() => onSave(form)} disabled={saving}>
        {saving ? "Saving…" : "Save Changes"}
      </Button>
    </div>
  );
}

export default AdminReps;
