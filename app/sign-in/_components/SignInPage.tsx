"use client"
import React, { useState } from 'react';
import { LogIn, User, Lock, EyeOff, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import app from '@/app.json'
import { useRouter } from 'next/navigation';

const SignInPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful!
        // The HttpOnly cookie is set automatically by the browser
        router.push('/dashboard/appointments');
      } else {
        // Login failed (e.g., 401 Unauthorized)
        alert(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during sign in. Please try again.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  }

  return (
    <section className="bg-primary min-h-screen flex items-center justify-center ">
      <Card className="w-full h-full max-w-md shadow-xl border-none py-8 gap-0">
        <CardHeader className="p-0 gap-0">
          <Image src="/logo.png" alt='/' width={600} height={600} className='w-40 m-auto' />
        </CardHeader>
        <CardContent className='px-12 py-8'>
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="name@example.com"
                  className="pl-10 h-12 shadow-md shadow-black/10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>

              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12 shadow-md shadow-black/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {/* 5. Add the toggle button */}
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute cursor-pointer right-3 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full text-md py-6 mt-3 cursor-pointer">
              Sign In
            </Button>
          </form>
        </CardContent>
        <CardFooter className='flex w-fit m-auto gap-2 text-primary font-bold'>
          <h2>Contact Us</h2>
          <h2>/</h2>
          <h2>Version {app.version}</h2>
        </CardFooter>
      </Card>
    </section>
  );
};

export default SignInPage;
