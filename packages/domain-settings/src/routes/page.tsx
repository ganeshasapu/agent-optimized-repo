import { Input, Label, Button } from "@biarritz/ui";

import { SettingsLayout } from "../components/settings-layout";

export default function SettingsPage() {
  return (
    <SettingsLayout
      title="General"
      description="Manage your workspace name and basic configuration."
    >
      <div className="flex flex-col gap-6">
        {/* Workspace section */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input
              id="workspace-name"
              defaultValue="Biarritz"
              className="max-w-sm"
            />
            <p className="text-xs text-muted-foreground">
              This is the name of your workspace. It will be visible to all members.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="workspace-url">Workspace URL</Label>
            <div className="flex items-center gap-2 max-w-sm">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                app.biarritz.io/
              </span>
              <Input id="workspace-url" defaultValue="biarritz" />
            </div>
            <p className="text-xs text-muted-foreground">
              The URL slug for your workspace.
            </p>
          </div>

          <div>
            <Button size="sm">Save changes</Button>
          </div>
        </section>

        {/* Danger zone */}
        <section className="border border-destructive/30 rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-1">Danger zone</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Irreversible and destructive actions.
          </p>
          <Button variant="destructive" size="sm">
            Delete workspace
          </Button>
        </section>
      </div>
    </SettingsLayout>
  );
}
