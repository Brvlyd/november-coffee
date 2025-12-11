# 🚀 Deployment Guide - November Coffee

## 📋 Pre-Deployment Checklist

- [ ] Supabase database setup complete
- [ ] Environment variables configured
- [ ] All features tested locally
- [ ] Admin credentials updated
- [ ] Security measures implemented

---

## 🌐 Deploy to Vercel (Recommended)

### Option 1: Via Vercel Dashboard

1. **Push to GitHub**
   \`\`\`bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   \`\`\`

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select "november-coffee" folder

3. **Configure Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_actual_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_key
     ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Via Vercel CLI

\`\`\`bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts
# Set environment variables when prompted

# Production deployment
vercel --prod
\`\`\`

---

## 🗄️ Supabase Production Setup

### 1. Database Configuration

\`\`\`sql
-- Enable Row Level Security (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventori ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed)
CREATE POLICY "Public read access" ON employees FOR SELECT USING (true);
CREATE POLICY "Public read access" ON attendance FOR SELECT USING (true);
CREATE POLICY "Public read access" ON inventori FOR SELECT USING (true);

-- For write operations, you may want to restrict based on authenticated users
-- This is a basic example - adjust for your security needs
CREATE POLICY "Public insert access" ON employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON inventori FOR INSERT WITH CHECK (true);
\`\`\`

### 2. Performance Optimization

\`\`\`sql
-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_inventori_kategori ON inventori(kategori);
CREATE INDEX IF NOT EXISTS idx_inventori_jumlah ON inventori(jumlah);
\`\`\`

### 3. Backup Strategy

- Enable automatic backups in Supabase dashboard
- Set up daily backup schedule
- Test restore procedure

---

## 🔒 Security Best Practices for Production

### 1. Environment Variables

✅ **Never commit** sensitive data to Git:

\`\`\`bash
# .gitignore should include:
.env.local
.env*.local
\`\`\`

### 2. Password Security

⚠️ **Current Implementation**: Passwords are stored in plain text (for demo)

**For Production**, implement password hashing:

\`\`\`typescript
// Install bcrypt
npm install bcrypt @types/bcrypt

// In your API routes
import bcrypt from 'bcrypt';

// When creating user
const hashedPassword = await bcrypt.hash(password, 10);

// When verifying
const isValid = await bcrypt.compare(password, hashedPassword);
\`\`\`

### 3. Add Rate Limiting

\`\`\`bash
npm install express-rate-limit
\`\`\`

### 4. CORS Configuration

Restrict API access to your domain only in production.

---

## 🔧 Post-Deployment Configuration

### 1. Custom Domain (Optional)

In Vercel Dashboard:
- Go to Project Settings → Domains
- Add your custom domain
- Update DNS records as instructed

### 2. Analytics Setup

\`\`\`bash
# Add Vercel Analytics
npm install @vercel/analytics

# In your root layout.tsx
import { Analytics } from '@vercel/analytics/react';

// Add <Analytics /> component
\`\`\`

### 3. Error Monitoring

Consider adding:
- [Sentry](https://sentry.io/) for error tracking
- [LogRocket](https://logrocket.com/) for session replay

---

## 📊 Performance Monitoring

### Vercel Analytics

- Automatic Core Web Vitals tracking
- View in Vercel Dashboard → Analytics

### Lighthouse Scores to Aim For

- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

---

## 🧪 Testing Production Build Locally

\`\`\`bash
# Build production version
npm run build

# Start production server
npm start

# Test at http://localhost:3000
\`\`\`

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to:

- **Main branch** → Production deployment
- **Other branches** → Preview deployments

### Disable Auto-Deploy (if needed)

In Vercel Dashboard:
- Project Settings → Git
- Configure branch deployment rules

---

## 🐛 Common Deployment Issues

### Issue: Environment Variables Not Working

**Solution**: 
- Redeploy after adding environment variables
- Check variable names match exactly (case-sensitive)

### Issue: Build Fails

**Solution**:
\`\`\`bash
# Test build locally first
npm run build

# Check for TypeScript errors
npm run lint
\`\`\`

### Issue: Database Connection Errors

**Solution**:
- Verify Supabase URL and key
- Check if Supabase project is active
- Test connection with Supabase client

### Issue: Images Not Loading

**Solution**:
- Add image domains to `next.config.ts`:
\`\`\`typescript
images: {
  domains: ['your-domain.com'],
}
\`\`\`

---

## 📱 Mobile PWA (Optional)

Convert to Progressive Web App:

\`\`\`bash
npm install next-pwa
\`\`\`

Add to `next.config.ts`:
\`\`\`typescript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  // your config
});
\`\`\`

---

## 🎯 Production Checklist

Before going live:

- [ ] Test all features in production build
- [ ] Verify admin login works
- [ ] Test employee check-in flow
- [ ] Check CRUD operations (employees, inventori)
- [ ] Test attendance monitoring
- [ ] Verify CSV export works
- [ ] Test on mobile devices
- [ ] Check browser compatibility
- [ ] Verify all environment variables
- [ ] Test error handling
- [ ] Check loading states
- [ ] Verify notifications work
- [ ] Test responsive design
- [ ] Run Lighthouse audit
- [ ] Check console for errors
- [ ] Test with real data

---

## 📞 Support & Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

---

**Your app is now live! 🎉**

Share your deployed URL and start using November Coffee system!
