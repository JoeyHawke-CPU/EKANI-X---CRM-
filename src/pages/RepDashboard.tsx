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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, TrendingUp, CheckCircle, DollarSign, AlertTriangle, Clock, Briefcase, Plus, Search } from "lucide-react";
import LeadForm from "@/components/LeadForm";
import { LEAD_STATUSES } from "@/lib/constants";
import type { Database } from "@/integrations/supabase/types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name}</p>
          </div>
          <Button onClick={() => { setEditLead(null); setShowForm(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> New Lead
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`rounded-lg bg-muted p-2.5 ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                  <p className="text-xl font-bold">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Follow-ups Panel */}
        {(overdueFollowups.length > 0 || dueTodayFollowups.length > 0) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-primary" /> Follow-Ups
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {overdueFollowups.map((l) => (
                <div key={l.lead_id} className="flex items-center justify-between rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 cursor-pointer" onClick={() => { setEditLead(l); setShowForm(true); }}>
                  <div>
                    <p className="text-sm font-medium">{l.client_business_name}</p>
                    <p className="text-xs text-muted-foreground">Due: {l.followup_due_date}</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">Overdue</Badge>
                </div>
              ))}
              {dueTodayFollowups.map((l) => (
                <div key={l.lead_id} className="flex items-center justify-between rounded-md border px-3 py-2 cursor-pointer" onClick={() => { setEditLead(l); setShowForm(true); }}>
                  <div>
                    <p className="text-sm font-medium">{l.client_business_name}</p>
                    <p className="text-xs text-muted-foreground">Due today</p>
                  </div>
                  <Badge className="text-xs">Today</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* My Profile Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div><p className="text-muted-foreground">Full Name</p><p className="font-medium">{profile?.full_name}</p></div>
              <div><p className="text-muted-foreground">Email</p><p className="font-medium">{profile?.email}</p></div>
              <div><p className="text-muted-foreground">Civil ID</p><p className="font-medium">{profile?.civil_id || "—"}</p></div>
              <div><p className="text-muted-foreground">Contact</p><p className="font-medium">{profile?.contact_number || "—"}</p></div>
              <div><p className="text-muted-foreground">Date Joined</p><p className="font-medium">{profile?.date_joined}</p></div>
              <div><p className="text-muted-foreground">Commission %</p><p className="font-medium">{profile?.commission_default_percentage}%</p></div>
              <div><p className="text-muted-foreground">Clients Visited</p><p className="font-medium">{profile?.clients_visited_count}</p></div>
              <div><p className="text-muted-foreground">Clients Closed</p><p className="font-medium">{closedDelivered}</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base">My Leads</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 w-48" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No leads found.</p>
            ) : (
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
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead.lead_id} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer" onClick={() => { setEditLead(lead); setShowForm(true); }}>
                        <td className="py-2.5 pr-4">{lead.lead_id}</td>
                        <td className="py-2.5 pr-4">{lead.date_added}</td>
                        <td className="py-2.5 pr-4 font-medium">{lead.client_business_name}</td>
                        <td className="py-2.5 pr-4">{lead.solution_selected || "—"}</td>
                        <td className="py-2.5 pr-4">{Number(lead.final_agreed_amount_kd).toFixed(3)}</td>
                        <td className="py-2.5 pr-4">
                          <Badge variant="secondary" className="text-xs font-normal">{lead.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
