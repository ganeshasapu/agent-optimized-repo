import { Separator } from "@biarritz/ui";

import { SettingsNav } from "./settings-nav";

interface SettingsLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function SettingsLayout({ title, description, children }: SettingsLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <header className="flex h-11 items-center border-b px-6 shrink-0">
        <h1 className="text-sm font-medium text-foreground">Settings</h1>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Settings sidebar */}
        <aside className="w-48 border-r p-3 shrink-0 overflow-y-auto">
          <SettingsNav />
        </aside>

        {/* Settings content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            <Separator className="mb-6" />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
