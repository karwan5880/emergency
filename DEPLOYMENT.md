# Deployment Guide

## Step 1: Deploy Convex to Production

```bash
npx convex deploy --prod
```

This will:
- Create a production deployment
- Give you a production URL (different from dev)
- Copy the production URL for Step 2

## Step 2: Set Convex Production Environment Variable

After deploying, set the Clerk JWT issuer in production:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://maximum-gopher-12.clerk.accounts.dev" --prod
```

## Step 3: Get Your Environment Variables

You'll need these 3 values for Vercel:

1. **NEXT_PUBLIC_CONVEX_URL** - From Step 1 (production URL)
2. **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY** - From Clerk Dashboard → API Keys (starts with `pk_`)
3. **CLERK_SECRET_KEY** - From Clerk Dashboard → API Keys (starts with `sk_`)

## Step 4: Deploy to Vercel

### Option A: Via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy
vercel --prod
```

### Option B: Via Vercel Dashboard

1. Push your code to GitHub
2. Go to https://vercel.com
3. Click "Add New Project"
4. Import your GitHub repository
5. Add environment variables (see Step 5)
6. Click "Deploy"

## Step 5: Set Environment Variables in Vercel

In Vercel Dashboard → Your Project → Settings → Environment Variables:

Add these 3 variables:
- `NEXT_PUBLIC_CONVEX_URL` = Your Convex production URL
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = Your Clerk publishable key
- `CLERK_SECRET_KEY` = Your Clerk secret key

**Important**: Make sure to select "Production" for all environments.

## Step 6: Update Clerk Allowed Origins

In Clerk Dashboard → Settings → Domains:
- Add your Vercel domain (e.g., `your-app.vercel.app`)

## Step 7: Test Your Deployment

Visit your Vercel URL and test:
- ✅ Sign up / Sign in
- ✅ Create an emergency
- ✅ View dashboard
- ✅ Real-time updates

---

## Troubleshooting

### Build Fails
- Check all environment variables are set
- Verify Convex production deployment is active
- Check Vercel build logs

### Auth Not Working
- Verify Clerk domain is added to allowed origins
- Check JWT template is active in Clerk
- Verify CLERK_JWT_ISSUER_DOMAIN is set in Convex production

### Convex Connection Issues
- Verify NEXT_PUBLIC_CONVEX_URL points to production URL
- Check Convex dashboard for deployment status
