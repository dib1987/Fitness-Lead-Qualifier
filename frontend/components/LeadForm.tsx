"use client";

import { useState, type FormEvent } from "react";

type Props = {
  tenant: string;
  utm: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "notice"; message: string }
  | { status: "error"; message: string };

const fitnessGoals = [
  "Lose weight",
  "Build muscle",
  "General fitness",
  "Sports performance",
];

const membershipTypes = [
  { name: "Basic", price: 11, perks: "Full gym access" },
  { name: "Premium", price: 21, perks: "Sauna and massage" },
  { name: "VIP", price: 32, perks: "Group training, sauna, tanning, and massage" },
];

const gymLocations = [
  "Ballantyne, Charlotte, NC",
  "Tampa, Florida",
  "Dallas, Texas",
];

export default function LeadForm({ tenant, utm }: Props) {
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ status: "submitting" });

    const form = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};

    for (const key of [
      "full_name",
      "email_address",
      "phone_number",
      "fitness_goal",
      "preferred_gym_location",
      "membership_type",
    ]) {
      const value = form.get(key);
      if (typeof value === "string" && value.trim() !== "") {
        payload[key] = value.trim();
      }
    }

    if (utm.utm_source) payload.utm_source = utm.utm_source;
    if (utm.utm_medium) payload.utm_medium = utm.utm_medium;
    if (utm.utm_campaign) payload.utm_campaign = utm.utm_campaign;

    try {
      const res = await fetch(`/api/leads/${tenant}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 202) {
        setState({
          status: "success",
          message: data.message ?? "Thanks! Check your email soon.",
        });
        return;
      }

      if (res.ok) {
        setState({
          status: "notice",
          message: data.message ?? "You're already on our list — we'll be in touch soon.",
        });
        return;
      }

      setState({
        status: "error",
        message: data.message ?? "Something went wrong. Please check your details and try again.",
      });
    } catch {
      setState({
        status: "error",
        message: "Something went wrong. Please try again.",
      });
    }
  }

  if (state.status === "success" || state.status === "notice") {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-stone-900">
          {state.status === "success" ? "You're in!" : "Already on the list"}
        </h2>
        <p className="mt-2 text-stone-600">{state.message}</p>
      </div>
    );
  }

  const submitting = state.status === "submitting";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm space-y-5"
    >
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-stone-700">
          Full name <span className="text-amber-600">*</span>
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          maxLength={200}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          placeholder="Jane Doe"
        />
      </div>

      <div>
        <label htmlFor="email_address" className="block text-sm font-medium text-stone-700">
          Email address <span className="text-amber-600">*</span>
        </label>
        <input
          id="email_address"
          name="email_address"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          placeholder="jane@example.com"
        />
      </div>

      <div>
        <label htmlFor="phone_number" className="block text-sm font-medium text-stone-700">
          Phone number
        </label>
        <input
          id="phone_number"
          name="phone_number"
          type="tel"
          maxLength={50}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          placeholder="(555) 123-4567"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fitness_goal" className="block text-sm font-medium text-stone-700">
            Fitness goal
          </label>
          <select
            id="fitness_goal"
            name="fitness_goal"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            defaultValue=""
          >
            <option value="">Select a goal</option>
            {fitnessGoals.map((goal) => (
              <option key={goal} value={goal}>
                {goal}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="membership_type" className="block text-sm font-medium text-stone-700">
            Membership interest
          </label>
          <select
            id="membership_type"
            name="membership_type"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            defaultValue=""
          >
            <option value="">Select a plan</option>
            {membershipTypes.map((type) => (
              <option key={type.name} value={type.name}>
                {type.name} (${type.price}/mo, excl. tax)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
        <p className="font-medium text-stone-700">Membership plans</p>
        <ul className="mt-2 space-y-1">
          {membershipTypes.map((type) => (
            <li key={type.name}>
              <span className="font-medium text-stone-700">
                {type.name} – ${type.price}/mo (excl. tax):
              </span>{" "}
              {type.perks}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label htmlFor="preferred_gym_location" className="block text-sm font-medium text-stone-700">
          Preferred location
        </label>
        <select
          id="preferred_gym_location"
          name="preferred_gym_location"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          defaultValue=""
        >
          <option value="">Select a location</option>
          {gymLocations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>

      {state.status === "error" && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}
