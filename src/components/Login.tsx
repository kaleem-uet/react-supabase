import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import supabase from "@/utils/supabase-client";
import { toast } from "sonner";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email:email,
      password: password,
    });
    if (error) {
      console.error("Login error:", error);
      toast.error("Login failed: " + error.message);
      setIsLoading(false);
      return;
    }
    if (data.user) {
      toast.success("Login successful!", {
        description: "Welcome back!",
        duration: 3000,
      });
      setIsLoading(false);
      onLogin(); // Call the onLogin callback to notify parent component
    } else {
      toast.error("Login failed: No user data returned.");
    }

  };

  return (
    <div className="max-w-sm mx-auto mt-20 p-8 bg-white rounded-xl shadow border">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Login</h2>
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
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </div>
  );
}
