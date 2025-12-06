# 🚀 Deployment Checklist

## ✅ Step 1: Convex Production (DONE)
- [x] Deployed Convex to production: `npx convex deploy --prod`
- [x] Set Clerk JWT issuer: `npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://maximum-gopher-12.clerk.accounts.dev" --prod`

**Get your Convex Production URL:**
1. Go to https://dashboard.convex.dev
2. Select your project: **content-lobster-678**
3. Click **Settings** → Look for **Production Deployment URL**
4. Copy that URL (looks like: `https://content-lobster-678.convex.cloud`)

---

## 📋 Step 2: Get Your Environment Variables

### A. Convex Production URL
- From Convex Dashboard (see above)
- Example: `https://content-lobster-678.convex.cloud`

### B. Clerk Keys
1. Go to https://dashboard.clerk.com
2. Select your app
3. Go to **API Keys**
4. Copy:
   - **Publishable Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)

---

## 🌐 Step 3: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Push to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Go to Vercel**:
   - Visit https://vercel.com
   - Sign in with GitHub
   - Click **"Add New Project"**
   - Import your repository

3. **Configure Project**:
   - Framework Preset: **Next.js**
   - Root Directory: `./` (default)
   - Build Command: `pnpm build` (or leave default)
   - Output Directory: `.next` (default)

4. **Add Environment Variables**:
   Click **"Environment Variables"** and add:
   ```
   NEXT_PUBLIC_CONVEX_URL = [Your Convex Production URL]
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = [Your Clerk Publishable Key]
   CLERK_SECRET_KEY = [Your Clerk Secret Key]
   ```
   ⚠️ Make sure to select **"Production"** for all!

5. **Deploy**:
   - Click **"Deploy"**
   - Wait for build to complete

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI (if needed)
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

When prompted:
- Set environment variables (use the 3 values above)
- Confirm deployment

---

## 🔧 Step 4: Configure Clerk for Production

1. Go to **Clerk Dashboard** → Your App → **Settings**
2. Go to **Domains** section
3. Add your Vercel domain:
   - `your-app.vercel.app`
   - Or your custom domain if you have one

---

## ✅ Step 5: Test Your Deployment

Visit your Vercel URL and test:
- [ ] Sign up works
- [ ] Sign in works
- [ ] Dashboard loads
- [ ] Can create emergency
- [ ] Real-time updates work

---

## 🐛 Troubleshooting

**Build fails?**
- Check Vercel build logs
- Verify all 3 environment variables are set
- Make sure Convex production is deployed

**Auth not working?**
- Check Clerk domain is added
- Verify JWT template is active
- Check environment variables match

**Convex connection issues?**
- Verify `NEXT_PUBLIC_CONVEX_URL` is production URL (not dev)
- Check Convex dashboard for deployment status

---

## 📝 Quick Reference

**Convex Dashboard:** https://dashboard.convex.dev/d/content-lobster-678  
**Clerk Dashboard:** https://dashboard.clerk.com  
**Vercel Dashboard:** https://vercel.com
