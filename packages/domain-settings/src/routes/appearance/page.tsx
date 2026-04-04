import { Button } from "@biarritz/ui";

import { SettingsLayout } from "../../components/settings-layout";

export default function AppearanceSettingsPage() {
  return (
    <SettingsLayout
      title="Appearance"
      description="Customize how the application looks and feels for you."
    >
      <div className="flex flex-col gap-6">
        {/* Theme */}
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Interface theme</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select the color theme for the application interface.
            </p>
          </div>

          <div className="flex gap-3">
            {/* Light theme option */}
            <button
              type="button"
              className="flex flex-col gap-2 rounded-lg border-2 border-primary p-3 cursor-pointer transition-colors hover:border-primary w-32"
              aria-label="Light theme"
            >
              <div className="h-16 w-full rounded bg-white border flex flex-col gap-1 p-1.5">
                <div className="h-1.5 w-8 rounded-sm bg-gray-200" />
                <div className="h-1.5 w-12 rounded-sm bg-gray-100" />
                <div className="h-1.5 w-10 rounded-sm bg-gray-100" />
              </div>
              <span className="text-xs font-medium text-center text-foreground">Light</span>
            </button>

            {/* Dark theme option */}
            <button
              type="button"
              className="flex flex-col gap-2 rounded-lg border-2 border-border p-3 cursor-pointer transition-colors hover:border-muted-foreground w-32"
              aria-label="Dark theme"
            >
              <div className="h-16 w-full rounded bg-gray-900 border border-gray-700 flex flex-col gap-1 p-1.5">
                <div className="h-1.5 w-8 rounded-sm bg-gray-700" />
                <div className="h-1.5 w-12 rounded-sm bg-gray-800" />
                <div className="h-1.5 w-10 rounded-sm bg-gray-800" />
              </div>
              <span className="text-xs font-medium text-center text-foreground">Dark</span>
            </button>

            {/* System theme option */}
            <button
              type="button"
              className="flex flex-col gap-2 rounded-lg border-2 border-border p-3 cursor-pointer transition-colors hover:border-muted-foreground w-32"
              aria-label="System theme"
            >
              <div className="h-16 w-full rounded overflow-hidden flex border">
                <div className="w-1/2 bg-white flex flex-col gap-1 p-1.5">
                  <div className="h-1.5 w-4 rounded-sm bg-gray-200" />
                  <div className="h-1.5 w-6 rounded-sm bg-gray-100" />
                </div>
                <div className="w-1/2 bg-gray-900 flex flex-col gap-1 p-1.5">
                  <div className="h-1.5 w-4 rounded-sm bg-gray-700" />
                  <div className="h-1.5 w-6 rounded-sm bg-gray-800" />
                </div>
              </div>
              <span className="text-xs font-medium text-center text-foreground">System</span>
            </button>
          </div>
        </div>

        <div>
          <Button size="sm">Save changes</Button>
        </div>
      </div>
    </SettingsLayout>
  );
}
