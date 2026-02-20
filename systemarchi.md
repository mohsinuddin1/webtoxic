# PureScan AI: System Architecture & Data Flow

This document outlines the core system architecture, authentication flow, payment processing, and the complete scan execution lifecycle of the **PureScan AI (Toxic Detector)** web application.

## 1. High-Level Tech Stack
* **Frontend:** React 19, Vite, Tailwind CSS 4, Framer Motion
* **State Management:** Zustand (`useStore`), React Query
* **Routing:** React Router v7
* **Backend & Database:** Supabase (PostgreSQL, Storage, Auth, Edge Functions)
* **AI Model:** Google Gemini (1.5 Flash) via Supabase Edge Functions
* **Payments:** Stripe (`@stripe/stripe-js`)

## 2. Authentication Flow (`AuthProvider.jsx`)
The application uses Supabase Auth for managing users. 

* **Providers Supported:** Google OAuth and Email/Password.
* **Initialization:** On app load, `AuthProvider` checks for an existing session via `supabase.auth.getSession()`.
* **State Sync:** It listens to auth state changes using `supabase.auth.onAuthStateChange()`. When a user logs in, their session, auth data, and profile data from the `users` table are fetched and stored globally in Zustand (`useStore`).
* **Routing Protection:** Unauthenticated users are redirected to the `/onboarding` page via the `ProtectedRoute` component in `App.jsx`.

## 3. Payment & Monetization Flow (`Paywall.jsx`)
The application restricts free users to a limit of 3 free daily scans. Once exhausted, they are prompted to upgrade to a Pro plan.

* **Trigger:** When `useStore.getRemainingScans() === 0` and the user profile `is_pro` is `false`, the user is directed to the `/paywall` route.
* **Plans:** The app offers 'Annual' and 'Weekly' subscription plans.
* **Execution:**
  1. User selects a plan and clicks "Start For Free".
  2. The function `createCheckoutSession` is invoked, interacting with Stripe to initiate a secure checkout session using the Stripe Price ID for the selected plan.
  3. The Stripe Hosted Checkout Page handles the transaction. Upon success, Stripe webhooks (likely handled on the backend) update the `is_pro` status in the Supabase `users` table.

## 4. The Core Scan Flow (What Happens After Clicking "Scan")
This is the primary user flow handled by `ScanPage.jsx` and the `analyze-scan` Edge Function.

### Step 4.1: Image Capture
1. User interacts with the UI (selects either "Item" mode or "Ingredient" mode).
2. Uses the device camera via `react-webcam` (or native MediaDevices) to capture an image, OR uploads an image from their gallery.
3. The image is captured and converted to a **Base64** string.

### Step 4.2: Upload & DB Initialization
1. When the user clicks **"Start Scanning"**, the app attempts to upload the image to the Supabase Storage bucket (`product-scans`).
2. The image is stored under the path `[user_id]/[timestamp].jpg`.
3. A public URL for the image is retrieved. If the upload fails, it gracefully falls back to using the Base64 representation.

### Step 4.3: AI Analysis (Edge Function)
1. The frontend invokes the Supabase Edge Function `analyze-scan`.
2. The request payload includes the `imageUrl` (or `imageBase64`) and the `scanMode` (Item/Ingredient).
3. The edge function constructs a rigid prompt instructing the AI to act as a toxicology expert, extract ingredients, and assess risks.
4. The function calls the **Google Gemini API** (`gemini-1.5-flash`), passing the prompt and the image data.
5. Gemini processes the image, classifies ingredients (carcinogen, endocrine_disruptor, safe, etc.), assigns a toxicity score (0-100), and calculates a grade (A-E).
6. Gemini responds with a structured JSON object, which the edge function returns to the frontend.

### Step 4.4: Persistence
1. Back on the frontend (`ScanPage.jsx`), the JSON result from the AI is saved to the Supabase `scans` table using `saveScan(scanData)`.
2. The `scans` table records: `user_id`, `image_url`, `product_name`, `ingredients`, `harmful_chemicals`, `grade`, and `score`.
3. The user's scan count is incremented via `incrementScan()`.

### Step 4.5: Result Display
1. Upon successful database save, the frontend navigates the user to the `/result/:id` page.
2. The state containing the AI's analysis results, the image URL, and the scan ID is passed along with the navigation.
3. The Result Page renders the toxicity score, grade, and detailed breakdown of each ingredient and its associated health risks.
