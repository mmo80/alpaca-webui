import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SettingsForm from './settings-form';
import SystemPromptForm from './system-prompt-form';

interface SettingsMenuProps {
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ setDialogOpen }) => {
  return (
    <>
      <span className="ms-2 text-xl">Settings</span>
      <Tabs defaultValue="manage" className="flex">
        <TabsList className="me-3 flex w-2/6 flex-col items-start justify-start gap-1 bg-inherit">
          <TabsTrigger
            value="manage"
            className="w-full items-start justify-start rounded p-2 ps-3 hover:bg-stone-900 data-[state=active]:bg-stone-900 data-[state=active]:shadow-none"
          >
            Api
          </TabsTrigger>
          <TabsTrigger
            value="password"
            className="w-full items-start justify-start rounded p-2 ps-3 hover:bg-stone-900 data-[state=active]:bg-stone-900 data-[state=active]:shadow-none"
          >
            System Prompt
          </TabsTrigger>
        </TabsList>
        <TabsContent value="manage" className="w-4/6">
          <SettingsForm setDialogOpen={setDialogOpen} />
        </TabsContent>
        <TabsContent value="password" className="w-4/6">
          <SystemPromptForm setDialogOpen={setDialogOpen} />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default SettingsMenu;
