import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SettingsForm from './settings-form';
import SystemPromptForm from './system-prompt-form';
import RagSettingsForm from './rag-settings-form';

interface SettingsMenuProps {
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ setDialogOpen }) => {
  return (
    <div className='flex flex-col'>
      <span className="ms-2 mb-2 text-xl">Settings</span>
      <Tabs defaultValue="manage" className="flex h-96 overflow-auto">
        <TabsList className="me-3 flex w-2/6 flex-col items-start justify-start gap-1 bg-inherit">
          <TabsTrigger
            value="manage"
            className="w-full items-start justify-start rounded p-2 ps-3 hover:bg-stone-900 data-[state=active]:bg-stone-900 data-[state=active]:shadow-none"
          >
            Api
          </TabsTrigger>
          <TabsTrigger
            value="system-prompt"
            className="w-full items-start justify-start rounded p-2 ps-3 hover:bg-stone-900 data-[state=active]:bg-stone-900 data-[state=active]:shadow-none"
          >
            System Prompt
          </TabsTrigger>
          <TabsTrigger
            value="system-prompt-rag"
            className="w-full items-start justify-start rounded p-2 ps-3 hover:bg-stone-900 data-[state=active]:bg-stone-900 data-[state=active]:shadow-none"
          >
            RAG
          </TabsTrigger>
          <TabsTrigger
            value="parameters"
            className="w-full items-start justify-start rounded p-2 ps-3 hover:bg-stone-900 data-[state=active]:bg-stone-900 data-[state=active]:shadow-none"
          >
            Parameters
          </TabsTrigger>
        </TabsList>
        <TabsContent value="manage" className="w-4/6">
          <SettingsForm setDialogOpen={setDialogOpen} />
        </TabsContent>
        <TabsContent value="system-prompt" className="w-4/6">
          <SystemPromptForm setDialogOpen={setDialogOpen} />
        </TabsContent>
        <TabsContent value="system-prompt-rag" className="w-4/6">
          <RagSettingsForm setDialogOpen={setDialogOpen} />
        </TabsContent>
        <TabsContent value="parameters" className="w-4/6">
          <section>Parameters</section>
        </TabsContent>
      </Tabs>
    </div>
  );
};
