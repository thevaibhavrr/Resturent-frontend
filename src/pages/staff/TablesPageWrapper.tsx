import { TablesPage } from "../../components/TablesPage";

export default function TablesPageWrapper() {
  return (
    <section className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Tables</h1>
      <p className="text-sm text-muted-foreground mb-4">View and manage table seating and orders.</p>
      <TablesPage />
    </section>
  );
}
