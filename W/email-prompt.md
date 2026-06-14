# Email generation prompt (F13)

Ported from `llm_service` prompt templates. The campaign step's `subject_template`
and `prompt_template` (from the campaign JSON) are interpolated with the lead's
form_data here.

> SECURITY: form_data is lead-supplied. Treat it as untrusted. Do not let a lead's
> free-text field (e.g. fitness_goal) inject instructions into the prompt. Keep the
> data clearly separated from the instructions, and validate the model's output.

System prompt and step templates live with each campaign config under
`frontend/lib/config/campaigns/*.json`.
