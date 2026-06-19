# Setup Guide — Supabase, Vercel & Trigger.dev

**Who is this for?** Someone setting this system up from scratch. Written so a 15-year-old can follow it.

Think of it this way:
- **Supabase** = the filing cabinet where all data is stored
- **Vercel** = the building where the website lives
- **Trigger.dev** = the robot that reads applications and sends emails
- **Resend** = the post office that delivers the emails
- **Anthropic** = the AI brain that writes the emails

All five talk to each other using **API keys** — these are like passwords that let one service talk to another.

---

## Part 1 — Supabase (The Filing Cabinet)

### What is Supabase?

Supabase is a free online database. It stores everything: lead information, emails sent, who is an admin, everything. It also handles admin login (who can access the dashboard).

### Step 1.1 — Create a Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click **Start for free**
3. Sign up with your GitHub account or email
4. Verify your email if asked

### Step 1.2 — Create a New Project

1. After logging in, click **New project**
2. Fill in:
   - **Name:** `lead-engine` (or any name you like)
   - **Database Password:** choose a strong password and **save it somewhere safe** — you will need this if you ever need to connect directly to the database
   - **Region:** choose the one closest to where your gym is (e.g., US East for USA)
3. Click **Create new project**
4. Wait about 2 minutes for it to set up (you will see a loading screen)

### Step 1.3 — Set Up the Database Tables

This step creates all the tables (think of tables like spreadsheets) that the system needs.

1. In Supabase, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Go to the project file: `supabase/migrations/0001_init.sql`
4. Copy **everything** in that file
5. Paste it into the SQL Editor box in Supabase
6. Click the green **Run** button
7. You should see: `Success. No rows returned.` — this means it worked

### Step 1.4 — Configure the Production URL (Critical)

This step tells Supabase where to send users after they click email confirmation links. If skipped, confirmation links will redirect to `localhost:3000` instead of your live website.

1. In Supabase, click **Authentication** in the left sidebar
2. Click **URL Configuration**
3. Set **Site URL** to your production Vercel URL:
   ```
   https://your-project.vercel.app
   ```
4. Under **Redirect URLs**, click **Add URL** and add:
   ```
   https://your-project.vercel.app/**
   ```
   (The `/**` wildcard allows all paths on your domain)
5. Click **Save changes**

> **If you skip this step:** Admin confirmation emails will contain links to `localhost:3000` which will fail for anyone not running the app locally.

---

### Step 1.5 — Create the Admin User

This creates the login account for the admin dashboard.

1. In Supabase, click **Authentication** in the left sidebar
2. Click **Users** → **Add user** → **Create new user**
3. Enter:
   - **Email:** the email address the admin will use to log in
   - **Password:** a strong password
4. Click **Create user**
5. Copy the **User UID** that appears (it looks like: `abc12345-...`) — you will need it in the next step

### Step 1.6 — Link the Admin to a Tenant

Now you need to tell the system which gym this admin manages.

1. Go back to **SQL Editor** → New query
2. Paste and run this (replace the email with your actual admin email):
   ```sql
   -- First, create the tenant (the gym)
   INSERT INTO tenants (slug, name, config)
   VALUES (
     'crunch',
     'Crunch Fitness',
     '{"company": {"signature_name": "Crunch Fitness"}}'::jsonb
   );

   -- Then link your admin account to it
   INSERT INTO admin_users (user_id, tenant_id)
   SELECT
     u.id,
     t.id
   FROM auth.users u, tenants t
   WHERE u.email = 'YOUR_ADMIN_EMAIL_HERE'
     AND t.slug = 'crunch';
   ```
3. Click **Run** — you should see: `1 row(s) inserted`

### Step 1.7 — Add the Campaign (Email Sequence)

1. In Supabase, go to **Table Editor** → click the `campaigns` table
2. Click **Insert row**
3. Fill in:
   - `tenant_id`: click the dropdown and select the crunch tenant
   - `slug`: `crunch_14day`
   - `name`: `Crunch 14-Day Nurture`
   - `steps`: copy the content from `frontend/lib/config/campaigns/crunch_14day.json`
   - `is_active`: `true`
4. Click **Save**

### Step 1.8 — Get Your Supabase API Keys

These are the "passwords" that let the website and the email robot talk to the database.

1. In Supabase, click **Project Settings** (gear icon) → **API**
2. Copy these three values and save them somewhere:

| Key Name | Where to find it | What it does |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Under "Project URL" | The address of your database |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Under "Project API keys → anon public" | Safe key for the website |
| `SUPABASE_SERVICE_ROLE_KEY` | Under "Project API keys → service_role secret" | **SECRET** — full database access, never share this |

> **Important:** The `service_role` key is like a master key to your database. Never put it anywhere public.

---

## Part 2 — Vercel (The Building)

### What is Vercel?

Vercel hosts your website. When someone goes to your website URL, Vercel is what serves them the page. It also runs your API routes (the code that processes form submissions).

### Step 2.1 — Create a Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up** → use your GitHub account
3. This connects Vercel to your GitHub so it can deploy your code automatically

### Step 2.2 — Deploy the Project

1. In Vercel, click **Add New Project**
2. Click **Import Git Repository** → select your repository
3. Configure:
   - **Framework Preset:** Next.js (Vercel usually detects this automatically)
   - **Root Directory:** click **Edit** → type `frontend`
4. **Do not click Deploy yet** — first add your environment variables (the passwords)

### Step 2.3 — Add Environment Variables

Environment variables are like a private list of passwords that your website can use but visitors cannot see.

In the deployment setup screen, click **Environment Variables** and add each one:

| Variable Name | Value | Where you got it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Step 1.7 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase Step 1.7 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (the secret one) | Supabase Step 1.7 |
| `TRIGGER_SECRET_KEY` | `tr_prod_...` | Trigger.dev (Part 3) |
| `RESEND_WEBHOOK_SECRET` | `whsec_...` | Resend (Part 4) |

For each: type the name in the **Key** box, paste the value, make sure **Production** is checked, click **Add**.

### Step 2.4 — Deploy

1. Click **Deploy**
2. Wait about 2–3 minutes for the build to finish
3. You will see a preview URL like `https://your-project.vercel.app`

### Step 2.5 — Make the Website Public

By default, Vercel protects your website behind a login. You need to turn this off.

1. Go to your project in Vercel → **Settings**
2. Click **Deployment Protection** in the left sidebar
3. Find the toggle that says **"Require Log In"** (set to Standard Protection)
4. **Turn it OFF**
5. Click **Save**

Now anyone can visit your website.

---

## Part 3 — Trigger.dev (The Robot)

### What is Trigger.dev?

Trigger.dev runs the background jobs that make the system work. When someone submits a form, Trigger.dev is the robot that:
- Scores the lead
- Asks Claude AI to write the email
- Sends the email
- Schedules the follow-up emails

It runs in the cloud 24/7, even when your computer is off.

### Step 3.1 — Create a Trigger.dev Account

1. Go to [app.trigger.dev](https://app.trigger.dev)
2. Sign up with your email or GitHub account
3. Create a new project — name it `lead-engine`

### Step 3.2 — Add Environment Variables

Just like Vercel, Trigger.dev also needs passwords to talk to other services.

1. In Trigger.dev, go to your project → **Environment** → **Environment Variables**
2. Click **Add new** and add each one:

| Variable Name | Value | Why it's needed |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | same as before | So the robot can connect to the database |
| `SUPABASE_SERVICE_ROLE_KEY` | same as before | So the robot can write to the database |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | So the robot can ask Claude AI to write emails |
| `RESEND_API_KEY` | `re_...` | So the robot can send emails |
| `APP_URL` | `https://your-vercel-url.vercel.app` | So the unsubscribe link in emails points to the right place |

> **Important:** Use `APP_URL` here — NOT `NEXT_PUBLIC_APP_URL`. This is the one that tripped us up during setup.

### Step 3.3 — Get Your Anthropic API Key

1. Go to [platform.anthropic.com](https://platform.anthropic.com)
2. Sign in or create an account
3. Click **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-`)
5. Add it to Trigger.dev as `ANTHROPIC_API_KEY`

### Step 3.4 — Deploy the Jobs to Trigger.dev

> **Important:** The project folder has spaces in the path which causes a bug with Trigger.dev's build system. Use a copy in a path without spaces.

1. Open a PowerShell terminal
2. Navigate to the trigger folder that has no spaces in the path:
   ```powershell
   cd "C:\le\trigger"
   ```
3. Run:
   ```powershell
   npx trigger.dev@latest deploy
   ```
4. Wait for it to finish — you will see: `Successfully deployed version XXXXXXXX.X with 2 detected tasks`
5. In the Trigger.dev dashboard, go to **Tasks** — you should see `process-lead` and `run-followup`

### Step 3.5 — Get the Production API Key

This key tells your Vercel website to send jobs to Trigger.dev's cloud (not your local computer).

1. In Trigger.dev → **API Keys**
2. Copy the **Production** key (starts with `tr_prod_...`)
3. Go to Vercel → Settings → Environment Variables → update `TRIGGER_SECRET_KEY` to this value
4. Go to Vercel → **Deployments** → **Redeploy** to apply the change

---

## Part 4 — Resend (The Post Office)

### Step 4.1 — Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Verify your email address

### Step 4.2 — Add Your Domain

For emails to come from your gym's email (e.g., `hello@crunchfitness.com`):
1. Go to **Domains** → **Add Domain**
2. Enter your domain name
3. Resend gives you DNS records to add — go to your domain registrar (GoDaddy, Namecheap, etc.) and add them
4. Wait for verification (can take up to 24 hours)

### Step 4.3 — Get Your API Key

1. Go to **API Keys** → **Create API Key**
2. Copy the key (starts with `re_`)
3. Add it to Trigger.dev as `RESEND_API_KEY`

### Step 4.4 — Set Up the Webhook

This tells Resend to notify your website when emails bounce or get marked as spam.

1. Go to **Webhooks** → **Add Endpoint**
2. Paste this URL:
   ```
   https://YOUR-VERCEL-URL.vercel.app/api/webhooks/email
   ```
3. Under **Events**, tick:
   - `email.delivered`
   - `email.bounced`
   - `email.complained`
4. Click **Add**
5. Click on the endpoint you just created
6. Copy the **Signing Secret** (starts with `whsec_`)
7. Add it to Vercel as `RESEND_WEBHOOK_SECRET`
8. Redeploy Vercel

---

## How They All Talk to Each Other

Here is the big picture of how all the passwords (API keys) flow:

```
Person submits form
        ↓
  VERCEL website
  (uses NEXT_PUBLIC keys to talk to Supabase)
  (uses TRIGGER_SECRET_KEY to wake up the robot)
        ↓
  TRIGGER.DEV robot
  (uses SUPABASE_SERVICE_ROLE_KEY to save data)
  (uses ANTHROPIC_API_KEY to ask Claude to write email)
  (uses RESEND_API_KEY to send the email)
  (uses APP_URL to build the unsubscribe link)
        ↓
  RESEND sends the email
  (uses RESEND_WEBHOOK_SECRET to tell Vercel about bounces)
        ↓
  Email arrives in person's inbox
```

---

## Final Checklist

After completing all parts above:

- [ ] Supabase database has all tables
- [ ] Supabase has at least one tenant (gym) and one admin user
- [ ] Vercel is deployed with all environment variables
- [ ] Vercel Deployment Protection is turned OFF
- [ ] Trigger.dev jobs are deployed (both `process-lead` and `run-followup` visible)
- [ ] `TRIGGER_SECRET_KEY` in Vercel uses the `tr_prod_` key
- [ ] Resend webhook is registered and `RESEND_WEBHOOK_SECRET` is in Vercel
- [ ] Submit a test lead and confirm you receive a welcome email within 2 minutes
