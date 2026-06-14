import EmailsTable from "./EmailsTable";

export default function EmailsPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900">Email History</h1>
      <p className="mt-1 text-sm text-stone-600">All outbound emails sent by the pipeline.</p>
      <div className="mt-6">
        <EmailsTable />
      </div>
    </div>
  );
}
