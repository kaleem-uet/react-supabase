import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import supabase from "@/utils/supabase-client";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setIsLoading(false);
    if (error) {
      toast.error("Signup failed: " + error.message);
      return;
    }
    if (data?.user) {
      toast.success("Signup successful! Please verify your email.", {
        description: "A verification email has been sent to your inbox.",
        duration: 5000,
      });
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20 p-8 bg-white rounded-xl shadow border">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Sign Up</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing up..." : "Sign Up"}
        </Button>
      </form>
    </div>
  );
}
