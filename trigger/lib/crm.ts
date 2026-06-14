// Mirrors frontend/lib/crm.ts — duplicated because trigger/ is a separate
// npm package from frontend/ and can't import across the boundary.
const HUBSPOT_UPSERT_URL = "https://api.hubapi.com/crm/v3/objects/contacts/upsert";

export async function upsertContact(
  formData: Record<string, string>,
  tenantConfig: Record<string, unknown>
): Promise<string | null> {
  const apiKey = process.env.HUBSPOT_API_KEY;
  if (!apiKey) return null; // skip if not configured, same as A

  const fullName = formData.full_name ?? "";
  const [firstName, ...rest] = fullName.split(/\s+/);
  const props: Record<string, string> = {
    email: formData.email_address ?? formData.email ?? "",
    firstname: firstName ?? "",
    lastname: rest.join(" "),
    phone: (formData.phone_number ?? "").trim(),
    hs_lead_status: "NEW",
    fitness_goal: formData.fitness_goal ?? "",
    preferred_gym_location: formData.preferred_gym_location ?? "",
    membership_type: formData.membership_type ?? "",
  };
  const properties = Object.fromEntries(Object.entries(props).filter(([, v]) => v));

  const res = await fetch(HUBSPOT_UPSERT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ properties, idProperty: "email" }),
  });
  if (!res.ok) throw new Error(`HubSpot upsert failed: ${res.status}`);
  const json = await res.json();
  return json.id ?? null;
}
