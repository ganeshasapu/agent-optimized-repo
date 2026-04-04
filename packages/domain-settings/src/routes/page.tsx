"use client";

import { useEffect, useState } from "react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@biarritz/ui";

import type { Theme } from "../lib/theme";
import { applyTheme, getActiveTheme, getStoredTheme, setStoredTheme } from "../lib/theme";

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored ?? getActiveTheme());
  }, []);

  function handleThemeChange(newTheme: Theme) {
    setTheme(newTheme);
    setStoredTheme(newTheme);
    applyTheme(newTheme);
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">
                Choose between light and dark mode. Your preference is saved
                automatically.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => handleThemeChange("light")}
              >
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => handleThemeChange("dark")}
              >
                Dark
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
