import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ekaniLogo from "@/assets/ekani-logo.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
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
            {sent ? (
              <div className="text-center space-y-3">
                <h2 className="text-lg font-semibold">Check your email</h2>
                <p className="text-sm text-muted-foreground">
                  If an account exists for <strong>{email}</strong>, we've sent a password reset link.
                </p>
                <Link to="/login" className="text-sm text-primary hover:underline">
                  Back to login
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <h2 className="text-lg font-semibold">Reset your password</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter your email and we'll send a reset link
                  </p>
                </div>
                <form onSubmit={handleReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={submitting}>
                    {submitting ? "Sending…" : "Send reset link"}
                  </Button>
                </form>
                <p className="text-sm text-center text-muted-foreground">
                  <Link to="/login" className="text-primary hover:underline">
                    Back to login
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
