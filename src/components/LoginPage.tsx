import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { UtensilsCrossed, Lock, User } from "lucide-react";
import { initializeRestaurants, saveCurrentUser } from "../utils/auth";
import { makeApi } from "../api/makeapi";
import { toast } from 'sonner';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize restaurants on component mount
  useState(() => {
    initializeRestaurants();
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    (async () => {
      try {
        const res = await makeApi('/api/auth/login', 'POST', { username, password });
        const data = res.data;
        if (data.token) {
          localStorage.setItem('token', data.token);
          // save minimal user info
          const user = data.user || { username };
          saveCurrentUser(user as any);
          toast.success(`Welcome back, ${user.username}!`);
          onLogin();
        } else {
          toast.error('Invalid username or password');
        }
      } catch (err: any) {
        console.error(err);
        const msg = err?.response?.data?.error || 'Login failed';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-3xl mb-2">Restaurant Management</h1>
          <p className="text-muted-foreground">Sign in to continue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Demo Credentials:</p>
          <div className="space-y-2 text-xs">
            <div>
              <p className="font-medium">Dev Restaurant (Admin):</p>
              <p className="text-muted-foreground">
                Divyapalce / 1234
              </p>
            </div>
            <div>
              <p className="font-medium">Dev Restaurant (Staff):</p>
              <p className="text-muted-foreground">
                v / v
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
