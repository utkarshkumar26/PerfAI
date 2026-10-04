"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { loginSchema, type LoginInput, type LoginRole } from "../validations/auth.schema";
import { ApiRequestError, useLogin } from "../actions/use-auth";

export function LoginForm() {
  const login = useLogin();
  const [mode, setMode] = useState<LoginRole>("EMPLOYEE");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [lockSeconds, setLockSeconds] = useState<number | null>(null);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", role: "EMPLOYEE" },
  });

  useEffect(() => {
    form.setValue("role", mode, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [form, mode]);

  useEffect(() => {
    if (lockSeconds === null || lockSeconds <= 0) return;
    const timer = window.setInterval(() => {
      if (lockSeconds <= 1) {
        setLockSeconds(0);
        setLoginError("The lockout period has ended. You can try signing in again.");
      } else {
        setLockSeconds(lockSeconds - 1);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lockSeconds]);

  async function submitLogin(values: LoginInput) {
    setLoginError(null);
    setLockSeconds(null);
    try {
      await login.mutateAsync({ ...values, role: mode });
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const { attemptsRemaining, locked, retryAfterSeconds } = error.details;
        if (locked && retryAfterSeconds) {
          setLockSeconds(retryAfterSeconds);
          setLoginError(error.message);
        } else if (attemptsRemaining !== undefined) {
          setLoginError(error.message);
        }
      }
    }
  }

  function fillDemoCredentials(role: LoginRole, email: string) {
    setMode(role);
    form.setValue("email", email, { shouldDirty: true });
    form.setValue("password", "Password1", { shouldDirty: true });
    setLoginError(null);
    setLockSeconds(null);
  }

  const lockMinutes = lockSeconds === null ? 0 : Math.ceil(lockSeconds / 60);
  const isLocked = lockSeconds !== null && lockSeconds > 0;
  const isManagerMode = mode === "MANAGER";

  return (
    <Card className="w-full max-w-md rounded-xl">
      <CardHeader className="space-y-3">
        <div className="grid w-full grid-cols-2 rounded-lg border bg-muted/50 p-1">
          <Button
            type="button"
            variant={isManagerMode ? "ghost" : "default"}
            size="sm"
            className="rounded-md"
            onClick={() => setMode("EMPLOYEE")}
            aria-pressed={!isManagerMode}
          >
            Employee login
          </Button>
          <Button
            type="button"
            variant={isManagerMode ? "default" : "ghost"}
            size="sm"
            className="rounded-md"
            onClick={() => setMode("MANAGER")}
            aria-pressed={isManagerMode}
          >
            Manager login
          </Button>
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {isManagerMode ? "Manager sign in" : "Welcome back"}
          </CardTitle>
          {isManagerMode && (
            <CardDescription>
              Manager access only. Use your manager credentials to continue.
            </CardDescription>
          )}
        </div>
      </CardHeader>
      <Form {...form}>
        <form
          noValidate
          onSubmit={form.handleSubmit(submitLogin)}
        >
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={isManagerMode ? "manager@company.com" : "you@company.com"}
                      autoComplete="email"
                      {...field}
                      onChange={(event) => {
                        if (
                          event.target.value.trim().toLowerCase() !==
                          form.getValues("email").trim().toLowerCase()
                        ) {
                          setLoginError(null);
                          setLockSeconds(null);
                        }
                        field.onChange(event);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      {...field}
                      onChange={(event) => {
                        if (!isLocked) setLoginError(null);
                        field.onChange(event);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Try a demo account</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials("MANAGER", "manager@perfai.demo")}
                >
                  Manager demo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials("EMPLOYEE", "abhay@perfai.demo")}
                >
                  Abhay (employee)
                </Button>
              </div>
            </div>
            {isManagerMode && (
              <p className="text-xs text-amber-600 dark:text-amber-400">Manager access only</p>
            )}
            {!loginError && (
              <p className="text-xs text-muted-foreground">
                3 sign-in attempts allowed. After 3 incorrect email or password attempts, sign-in
                is locked for 1 hour.
              </p>
            )}
            {loginError && (
              <p
                role="alert"
                className={`rounded-md border px-3 py-2 text-sm ${
                  isLocked
                    ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
                    : "border-destructive/30 bg-destructive/5 text-destructive"
                }`}
              >
                {loginError}
                {isLocked && lockSeconds !== null && (
                  <span className="mt-1 block font-medium">
                    Try again in {lockMinutes} {lockMinutes === 1 ? "minute" : "minutes"}.
                  </span>
                )}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={login.isPending || isLocked}>
              {login.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Create one
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
