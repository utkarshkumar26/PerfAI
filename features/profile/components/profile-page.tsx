"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Link2, Globe } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useProfile, useUpdateProfile } from "@/features/profile/actions/use-profile";
import { profileSchema } from "@/features/profile/validations/profile.schema";

type FormValues = import("zod").infer<typeof profileSchema>;

const FIELDS: (keyof FormValues)[] = [
  "name",
  "designation",
  "experience",
  "bio",
  "skills",
  "education",
  "githubUrl",
  "linkedinUrl",
  "portfolioUrl",
];

function completeness(profile: FormValues): number {
  const filled = FIELDS.filter((f) => {
    const v = profile[f];
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== "" && v !== null;
  }).length;
  return Math.round((filled / FIELDS.length) * 100);
}

export function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const update = useUpdateProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(profileSchema) as never,
    defaultValues: { name: "", skills: [] },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name,
        designation: profile.designation ?? "",
        experience: profile.experience ?? undefined,
        bio: profile.bio ?? "",
        skills: profile.skills,
        education: profile.education ?? "",
        githubUrl: profile.githubUrl ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        portfolioUrl: profile.portfolioUrl ?? "",
        departmentId: profile.department?.id ?? null,
      });
    }
  }, [profile, form]);

  if (isLoading || !profile) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const pct = completeness(form.getValues());

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatarUrl ?? undefined} />
          <AvatarFallback className="text-xl">
            {profile.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
          <div className="mt-1 flex gap-1.5">
            <Badge variant="secondary">{profile.role}</Badge>
            {profile.department && <Badge variant="outline">{profile.department.name}</Badge>}
            {profile.manager && <Badge variant="outline">Reports to {profile.manager.name}</Badge>}
          </div>
        </div>
        {(profile.githubUrl || profile.linkedinUrl || profile.portfolioUrl) && (
          <div className="flex gap-2 text-muted-foreground">
            {profile.githubUrl && (
              <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <Link2 className="h-4 w-4" />
              </a>
            )}
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Link2 className="h-4 w-4" />
              </a>
            )}
            {profile.portfolioUrl && (
              <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" aria-label="Portfolio">
                <Globe className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Profile completeness</CardTitle>
          <CardDescription>Complete your profile for better AI suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Progress value={pct} className="h-2 flex-1" />
            <span className="text-sm font-medium">{pct}%</span>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((v: FormValues) =>
            update.mutate({
              ...v,
              githubUrl: v.githubUrl || undefined,
              linkedinUrl: v.linkedinUrl || undefined,
              portfolioUrl: v.portfolioUrl || undefined,
              departmentId: v.departmentId ?? null,
            })
          )}
          className="space-y-6"
        >
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation</FormLabel>
                      <FormControl>
                        <Input placeholder="Frontend Engineer" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience (years)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={50}
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education</FormLabel>
                      <FormControl>
                        <Input placeholder="B.Tech Computer Science" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="A short professional summary..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills (comma separated)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="React, TypeScript, Node.js"
                        value={(field.value ?? []).join(", ")}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Links</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="githubUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="portfolioUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={update.isPending}>
              {update.isPending && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

