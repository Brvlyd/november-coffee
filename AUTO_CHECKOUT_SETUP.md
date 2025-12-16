# Auto Checkout Setup Instructions

## Overview
Sistem auto-checkout akan otomatis melakukan checkout untuk pegawai yang lupa checkout di akhir setiap shift.

## How It Works

### Shift End Times
- **Shift Pagi**: Berakhir jam 19:00 WIB
- **Shift Malam**: Berakhir jam 03:00 WIB (dini hari)
- **Shift Dini Hari**: Berakhir jam 11:00 WIB

### Auto Checkout Logic
1. Sistem akan mengecek apakah ada pegawai yang sudah check-in tapi belum check-out
2. Di akhir setiap shift (dengan buffer 15 menit), sistem akan otomatis checkout pegawai tersebut
3. Waktu checkout yang dicatat adalah waktu akhir shift (bukan waktu sistem dijalankan)
4. Gaji tetap dihitung penuh untuk shift yang di-auto-checkout

### Salary Calculation
- **Gaji per shift**: Rp 70.000
- **Denda keterlambatan**: Rp 1.000/menit (jika check-in lebih dari 5 menit setelah shift dimulai)
- Shift dihitung berdasarkan `check_in_at`, tidak peduli apakah `check_out_at` ada atau di-auto-checkout

## Setup Options

### Option 1: Using External Cron Service (Recommended for Production)

#### 1. Set Environment Variable
Add to your `.env.local`:
```env
CRON_SECRET=your-secure-random-token-here
```

Generate a secure token:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 2. Deploy Your App
Deploy to Vercel, Netlify, or any hosting platform.

#### 3. Setup Cron Job
Use a free cron service like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Cron-Jobs.de](https://console.cron-jobs.de)

Configure 3 cron jobs to run:

**Cron Job 1 - End of Shift Pagi (19:00 WIB)**
```
Schedule: 0 19 * * *  (Every day at 19:00 WIB)
URL: https://your-domain.com/api/attendance/auto-checkout
Method: POST
Headers: Authorization: Bearer your-secure-random-token-here
```

**Cron Job 2 - End of Shift Malam (03:00 WIB)**
```
Schedule: 0 3 * * *  (Every day at 03:00 WIB)
URL: https://your-domain.com/api/attendance/auto-checkout
Method: POST
Headers: Authorization: Bearer your-secure-random-token-here
```

**Cron Job 3 - End of Shift Dini Hari (11:00 WIB)**
```
Schedule: 0 11 * * *  (Every day at 11:00 WIB)
URL: https://your-domain.com/api/attendance/auto-checkout
Method: POST
Headers: Authorization: Bearer your-secure-random-token-here
```

### Option 2: Manual Trigger (For Testing)

You can manually trigger auto-checkout:

```bash
# Using curl (add your token)
curl -X POST https://your-domain.com/api/attendance/auto-checkout \
  -H "Authorization: Bearer your-secure-random-token-here"

# Or just visit in browser (GET request also works):
https://your-domain.com/api/attendance/auto-checkout
```

### Option 3: Using Vercel Cron (If using Vercel Pro)

If you have Vercel Pro plan, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/attendance/auto-checkout",
      "schedule": "0 19 * * *"
    },
    {
      "path": "/api/attendance/auto-checkout",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/attendance/auto-checkout",
      "schedule": "0 11 * * *"
    }
  ]
}
```

## Testing

### Test Locally
1. Start your development server:
```bash
npm run dev
```

2. Call the endpoint:
```bash
curl http://localhost:3000/api/attendance/auto-checkout
```

3. Check the response - it will tell you if any auto-checkouts were performed

### Expected Response
```json
{
  "success": true,
  "message": "Auto checkout completed for Pagi shift",
  "shift": "Pagi",
  "totalAutoCheckedOut": 2,
  "checkoutTime": "2025-12-16T19:00:00.000Z",
  "currentTime": "2025-12-16T19:05:00.000Z"
}
```

Or if not at shift end time:
```json
{
  "success": true,
  "message": "Not at the end of any shift",
  "currentTime": "2025-12-16T15:30:00.000Z"
}
```

## Monitoring

Check your application logs to see auto-checkout activity:
- Number of employees auto-checked out
- Which shift was processed
- Any errors encountered

## Security Notes

1. **Always use Authorization header** with a secure token in production
2. **Keep CRON_SECRET secure** - don't commit it to Git
3. The endpoint checks if current time is within 15 minutes of shift end time
4. Only processes records with `check_in_at` but no `check_out_at`

## Troubleshooting

### Auto-checkout not working?
1. Check if cron job is running at correct times (WIB timezone)
2. Verify Authorization header is correct
3. Check application logs for errors
4. Ensure database connection is working
5. Verify shift end times in `lib/shift.ts`

### Employees getting checked out too early?
- The system has a 15-minute buffer window after shift end
- Check the time buffer logic in `auto-checkout/route.ts`

### Need to adjust shift times?
- Edit shift configuration in `lib/shift.ts`
- Adjust auto-checkout time windows in `auto-checkout/route.ts`

## Future Enhancements

Consider adding:
1. Email/SMS notification to employees when auto-checked out
2. Admin dashboard to view auto-checkout history
3. Configurable grace period for auto-checkout
4. Different checkout times for different employee groups
