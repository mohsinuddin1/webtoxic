# Supabase Setup Guide for PureScan AI

This guide covers the necessary steps to configure your Supabase project, including Database Schema, Google Authentication, and Storage.

## 1. Create a Supabase Project

1.  Go to [database.new](https://database.new) and create a new project.
2.  Note down your `Project URL` and `anon public` key.
3.  Add these to your local `.env` file (create one if it doesn't exist):

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 2. Database Schema Setup

You can run the following SQL commands in the Supabase **SQL Editor** to set up your tables.

### Users Table
Stores user profiles, streaks, and subscription status.

```sql
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  daily_scans int default 0,
  current_streak int default 0,
  level_xp int default 0,
  is_pro boolean default false,
  last_scan_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;

-- Policies
create policy "Users can view their own profile"
  on public.users for select
  using ( auth.uid() = id );

create policy "Users can insert their own profile"
  on public.users for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile"
  on public.users for update
  using ( auth.uid() = id );
```

### Scans Table
Stores scan results and analysis data.

```sql
create table public.scans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  image_url text,
  product_name text,
  ingredients text[], -- storing array of strings if possible, or text content
  harmful_chemicals jsonb, -- or text, depending on how you store objects
  grade text,
  score int,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: Adjust `ingredients` and `harmful_chemicals` types based on your exact data shape. 
-- In useStore.js, it seems to handle them as passed directly from the analysis result.

-- Enable Row Level Security (RLS)
alter table public.scans enable row level security;

-- Policies
create policy "Users can view their own scans"
  on public.scans for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own scans"
  on public.scans for insert
  with check ( auth.uid() = user_id );
```

## 3. Google Authentication Setup

1.  Go to the **Authentication** > **Providers** section in your Supabase dashboard.
2.  Enable **Google**.
3.  You will need a **Client ID** and **Client Secret** from Google Cloud Platform.

### Steps in Google Cloud Console:
1.  Go to [console.cloud.google.com](https://console.cloud.google.com/).
2.  Create a new project (e.g., "PureScan Auth").
3.  Go to **APIs & Services** > **OAuth consent screen**.
    *   Select **External**.
    *   Fill in required app details (App name, email).
    *   (Optional) Add yourself as a test user if the app is in "Testing" mode.
4.  Go to **Credentials** > **Create Credentials** > **OAuth client ID**.
    *   Application type: **Web application**.
    *   **Authorized JavaScript origins**:
        *   `http://localhost:5173` (Local Dev)
        *   `https://your-production-domain.com` (Production)
    *   **Authorized redirect URIs**:
        *   Paste the **Callback URL (for OAuth)** found in your Supabase Google Provider settings.
        *   Format: `https://<your-project-ref>.supabase.co/auth/v1/callback`
5.  Copy the **Client ID** and **Client Secret** and stash them into the Supabase Google Provider settings.
6.  Click **Save** in Supabase.

## 4. Storage Setup

1.  Go to the **Storage** section in Supabase.
2.  Create a new bucket named **`product-scans`**.
3.  **Public Access**: You can disable "Public" if we used signed URLs, but simpler apps often leave it public for easier image retrieval.
    *   *Recommended*: Keep it private and use RLS policies, OR set to Public if `image_url` needs to be directly accessible without tokens.
    *   *Current Code assumption*: The app likely uses public URLs or signed URLs. If `image_url` is stored as a direct link, the bucket should probably be Public.

### Storage Policies (in Storage > Policies)

Click "New Policy" under the `product-scans` bucket.

**Policy 1: Allow authenticated uploads**
*   **Allowed operations**: INSERT
*   **Target roles**: authenticated
*   **Policy definition**: `bucket_id = 'product-scans'`

**Policy 2: Allow users to view their own files (or Public view)**
*   If Bucket is Public, anyone can view.
*   If Private, add SELECT policy: `bucket_id = 'product-scans' AND auth.uid() = owner` (requires objects to have owner metadata usually, simpler to just allow authenticated select).

**Simplified SQL for Storage Policy (run in SQL Editor):**

```sql
-- Allow authenticated users to upload files
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'product-scans' );

-- Allow users to view files (if bucket is public, this might not be strictly needed for viewing, but good for listing)
create policy "Allow public viewing"
on storage.objects for select
to public
using ( bucket_id = 'product-scans' );
```

## 5. Final Checks

*   Ensure your `.env` file is in the root and ignored by git (`.gitignore`).
*   Restart your dev server (`npm run dev`) after changing env variables.
