import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import ClientIntakeForm from "@/components/ClientIntakeForm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

const IntakeFormPage = () => {
  const { user, role } = useAuth();
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: role === "admin" ? ["admin-leads-intake"] : ["my-leads-intake"],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("*")
        .order("date_added", { ascending: false });

      if (role !== "admin") {
        query = query.eq("sales_exec_id", user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!user,
  });

  const selectedLead = leads.find((l) => l.lead_id.toString() === selectedLeadId);

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedLeadId("");
  };

  const initialData = selectedLead
    ? {
        client_name: selectedLead.client_contact_person || "",
        business_name: selectedLead.client_business_name || "",
        phone_number: selectedLead.phone_number || "",
        whatsapp_number: selectedLead.whatsapp_number || "",
        email: selectedLead.email || "",
        business_address: selectedLead.business_full_address || "",
      }
    : undefined;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Website Intake Form</h1>
          <p className="text-muted-foreground mt-1">
            Select an existing client to fill out their website intake details
          </p>
        </div>

        {!showForm ? (
          <Card>
            <CardContent className="pt-6">
              <div className="max-w-md space-y-4">
                <div className="space-y-2">
                  <Label>Select Client / Lead</Label>
                  <Select value={selectedLeadId} onValueChange={handleSelectLead} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoading ? "Loading clients..." : "Choose a client"} />
                    </SelectTrigger>
                    <SelectContent>
                      {leads.map((lead) => (
                        <SelectItem key={lead.lead_id} value={lead.lead_id.toString()}>
                          {lead.client_business_name} {lead.client_contact_person ? `(${lead.client_contact_person})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {leads.length} client{leads.length !== 1 ? "s" : ""} available
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <ClientIntakeForm initialData={initialData} onClose={handleCloseForm} />
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default IntakeFormPage;
