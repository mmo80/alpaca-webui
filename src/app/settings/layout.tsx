import { SettingsMenu } from './_components/settings-menu';

export default function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="h-full overflow-y-scroll p-2">
      <div className="grid w-full ps-3 pt-2 pb-3">
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>
      <div className="grid items-start gap-6 md:grid-cols-[180px_1fr]">
        <SettingsMenu />
        {children}
      </div>
    </main>
  );
}
