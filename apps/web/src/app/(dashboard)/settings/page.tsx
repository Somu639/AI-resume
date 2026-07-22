"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/motion";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage profile, preferences, and export defaults."
      />

      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>How you appear across ResumeAI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="Alex Kim" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="alex@example.com" />
              </div>
            </div>
            <Button>Save profile</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Light, dark, or follow system</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Color mode</p>
              <p className="text-sm text-muted-foreground">
                Toggle between light and dark themes
              </p>
            </div>
            <ThemeToggle />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Email digests</p>
                <p className="text-sm text-muted-foreground">
                  Weekly summary of optimizations
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Auto-highlight AI changes</p>
                <p className="text-sm text-muted-foreground">
                  Show diffs by default in the editor
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Default export</p>
                <p className="text-sm text-muted-foreground">Prefer PDF over DOCX</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
            <CardDescription>Irreversible account actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive">Delete account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
