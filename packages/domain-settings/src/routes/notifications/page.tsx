import { Button, Separator } from "@biarritz/ui";

import { SettingsLayout } from "../../components/settings-layout";

interface NotificationRowProps {
  label: string;
  description: string;
  defaultChecked?: boolean;
}

function NotificationRow({ label, description, defaultChecked = false }: NotificationRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          defaultChecked={defaultChecked}
        />
        <div className="w-9 h-5 bg-border rounded-full peer peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
      </label>
    </div>
  );
}

export default function NotificationsSettingsPage() {
  return (
    <SettingsLayout
      title="Notifications"
      description="Choose which notifications you receive and how they are delivered."
    >
      <div className="flex flex-col gap-6">
        <div className="border rounded-lg divide-y px-4">
          <NotificationRow
            label="New member joined"
            description="When someone new joins your workspace."
            defaultChecked
          />
          <NotificationRow
            label="Project updates"
            description="Updates and changes to projects you follow."
            defaultChecked
          />
          <NotificationRow
            label="Issue assigned to you"
            description="When an issue is assigned to you."
            defaultChecked
          />
          <NotificationRow
            label="Comments on your issues"
            description="When someone comments on your issues."
          />
          <NotificationRow
            label="Weekly digest"
            description="A weekly summary of workspace activity."
          />
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">Email notifications</p>
          <div className="border rounded-lg divide-y px-4">
            <NotificationRow
              label="Email digest"
              description="Receive a daily email digest."
            />
            <NotificationRow
              label="Mentions"
              description="Email when someone mentions you."
              defaultChecked
            />
          </div>
        </div>

        <div>
          <Button size="sm">Save preferences</Button>
        </div>
      </div>
    </SettingsLayout>
  );
}
