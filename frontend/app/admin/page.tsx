import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminNav } from "@/components/admin/AdminNav";

export default function AdminPage() {
  return (
    <AdminGuard>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Админка</h1>
        <AdminNav />
      </div>
    </AdminGuard>
  );
}
