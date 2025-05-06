import { DocumentsForm } from './_components/documents-form';

export default function Page() {
  return (
    <main className="flex h-full flex-col lg:flex-row">
      <section className="basis-5/5 overflow-y-scroll px-3 sm:basis-3/5">
        <DocumentsForm />
      </section>
    </main>
  );
}
