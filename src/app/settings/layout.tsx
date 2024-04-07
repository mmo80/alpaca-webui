import { SettingsMenu } from './_components/settings-menu';

export default function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="p-4 px-3 md:mt-0 lg:gap-6 overflow-y-scroll">
      <div className="mx-auto grid w-full pb-6 ps-3">
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>
      <div className="mx-auto grid w-full items-start gap-6 md:grid-cols-[160px_1fr]">
        <SettingsMenu />
        <div className="grid gap-6">
          {children}
        </div>
      </div>
    </main>
  );
}
