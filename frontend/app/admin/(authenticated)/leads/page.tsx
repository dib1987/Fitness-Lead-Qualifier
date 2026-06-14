import LeadsTable from "./LeadsTable";

export default function LeadsPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Leads</h1>
      <p className="mt-1 text-sm text-stone-600">All captured leads for this tenant.</p>
      <div className="mt-6">
        <LeadsTable />
      </div>
    </div>
  );
}
