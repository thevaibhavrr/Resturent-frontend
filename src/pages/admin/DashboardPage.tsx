import { AdminDashboard } from "../../components/admin/AdminDashboard";

export default function DashboardPage() {
  return (
  <section className="p-6" style={{marginTop:'40px'}}>
      {/* Page-level description */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
     
      </div>

      <AdminDashboard />
    </section>
  );
}
