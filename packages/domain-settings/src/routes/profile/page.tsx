import { Input, Label, Button, Textarea } from "@biarritz/ui";

import { SettingsLayout } from "../../components/settings-layout";

export default function ProfileSettingsPage() {
  return (
    <SettingsLayout
      title="Profile"
      description="Manage your personal information and how others see you."
    >
      <div className="flex flex-col gap-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-muted text-violet text-xl font-semibold">
            JD
          </span>
          <div className="flex flex-col gap-1">
            <Button variant="outline" size="sm">Change avatar</Button>
            <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max 1MB.</p>
          </div>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="first-name">First name</Label>
              <Input id="first-name" defaultValue="Jane" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="last-name">Last name</Label>
              <Input id="last-name" defaultValue="Doe" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" defaultValue="jane@example.com" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell your team a little about yourself..."
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <div>
          <Button size="sm">Save changes</Button>
        </div>
      </div>
    </SettingsLayout>
  );
}
