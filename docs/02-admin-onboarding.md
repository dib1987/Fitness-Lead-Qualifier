# Admin Onboarding Guide — Fitness Lead Qualifier

**Who is this for?** Gym managers and staff who use the admin dashboard to manage leads.

---

## What is the Admin Dashboard?

The admin dashboard is a private website where you can see everyone who has submitted an enquiry form. You can view their details, see what emails were sent to them, mark them as booked, and add your own notes. Think of it like a simple CRM (Customer Relationship Manager) — a place to track all your leads in one spot.

---

## How to Log In

1. Go to: `[your-website]/admin/sign-in`
2. Enter your **email address** and **password**
3. Click **Sign In**
4. You will be taken to the main dashboard

> If you do not have a login yet, ask the system administrator to create an account for you at `[your-website]/admin/sign-up`.

---

## The Dashboard — What You See

When you log in, you will see:

- **Left sidebar** — navigation menu with links to Dashboard and Leads
- **Main area** — the content changes depending on which page you are on

The sidebar has two links:
- **Dashboard** — a summary view
- **Leads** — the full list of everyone who submitted a form

---

## The Leads Page

This is where you will spend most of your time. Here is what you see:

### The Leads Table

A list of all enquiries with these columns:

| Column | What it means |
|---|---|
| Name | The person's full name |
| Email | Their email address |
| Status | Where they are in the process (see below) |
| Score | How qualified they are (0–100) |
| Source | How they found you (e.g. web form, Facebook) |
| Date | When they submitted the form |

### Lead Statuses

| Status | What it means |
|---|---|
| received | Just submitted — email not sent yet |
| email_sent | Welcome email was sent |
| bounced | Email address does not exist or is wrong |
| complained | Person marked the email as spam |
| booked | You marked them as booked for a session |
| unsubscribed | Person clicked the unsubscribe link |

### Searching and Filtering

- **Search box** — type a name or email to find a specific person
- **Status filter** — click a status button to show only leads with that status

---

## Opening a Lead's Details

Click on any row in the leads table to open the **detail panel** on the right side of the screen.

The detail panel shows:

### Contact Info
- Full name, email, phone number
- What fitness goal they mentioned
- Which gym location they prefer
- What membership type they want
- When they submitted the form

### Email History
A list of every email sent to this person, including:
- Which step it was (Step 0 = welcome, Step 1 = day 3, etc.)
- The subject line
- A preview of the email body
- Whether it was delivered, bounced, or opened

### Activity Log
A timeline of everything that happened with this lead — form submitted, email sent, status changes.

### Campaign Status
Whether they are still in the email sequence (Active), or if it has finished (Completed).

---

## Marking a Lead as Booked

When someone books a session or pays for a membership:

1. Open their lead detail panel (click their row)
2. Click the **Mark as Booked** button
3. The status changes to `booked` and the date is recorded

This also stops any further follow-up emails to that person (they are a customer now, not a lead).

---

## Adding Notes

You can add internal notes to any lead — these are only visible to admins, not the customer.

1. Open their lead detail panel
2. Find the **Notes** field at the bottom
3. Type your notes (e.g. "Called on 20 June, interested in premium membership")
4. Click **Save Notes**

Notes are useful for recording phone conversations, special requests, or anything you want to remember about this person.

---

## Exporting Leads to a Spreadsheet

To download all leads as a CSV file (which opens in Excel or Google Sheets):

1. Go to the **Leads** page
2. Apply any filters you want (e.g. only `email_sent` leads)
3. Click the **Export CSV** button
4. A file will download to your computer
5. Open it in Excel or Google Sheets

---

## How to Sign Out

1. Click the **Sign out** button at the bottom of the left sidebar
2. You will be taken back to the sign-in page

Always sign out when you are done, especially on a shared computer.

---

## Common Questions

**I forgot my password. How do I reset it?**
On the sign-in page, click **Forgot password** and follow the instructions sent to your email.

**I can only see some leads, not all of them. Is that normal?**
Yes — you only see leads for the tenant (gym location) your account is linked to. If you manage multiple locations, contact the administrator.

**Can I delete a lead?**
No — leads are kept for record-keeping. You can add a note explaining why a lead is no longer active.

**A lead's email bounced. What should I do?**
Contact the person by phone if you have their number, and ask them to resubmit with the correct email address.

**I see a lead submitted twice. Will they get double emails?**
No — the system detects duplicates and only processes the first submission. The second submission will not trigger any emails.
