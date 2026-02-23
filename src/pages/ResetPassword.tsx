import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ekaniLogo from "@/assets/ekani-logo.png";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      toast.error("Invalid or expired reset link");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      navigate("/", { replace: true });
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 flex flex-col items-center">
          <img src={ekaniLogo} alt="EKANI AI Consultancy" className="h-16 w-auto mb-4" />
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardContent className="pt-6 space-y-5">
            <div className="text-center">
              <h2 className="text-lg font-semibold">Set new password</h2>
              <p className="text-sm text-muted-foreground mt-1">Enter your new password below</p>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={submitting}>
                {submitting ? "Updating…" : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
