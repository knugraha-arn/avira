# IMS Risk Management

Sistem manajemen risiko berbasis ISO 27001 · Next.js 14 + Supabase

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
Buat file `.env.local` dari template:
```bash
cp .env.local.example .env.local
```
Isi dengan nilai dari Supabase dashboard:
- Project: `https://supabase.com/dashboard/project/qlmtwssjcostyddiwszc`
- Settings → API → Project URL & anon key

### 3. Jalankan development server
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000)

## Struktur folder

```
src/
├── app/
│   ├── auth/login/        # Halaman login
│   ├── dashboard/         # Dashboard utama
│   └── risks/             # Risk register + detail
├── components/
│   ├── layout/Sidebar.tsx # Navigasi
│   ├── risk/              # Komponen spesifik risk
│   └── ui/                # Badge, button, dll
├── lib/
│   ├── supabase/          # Client, server, middleware
│   └── utils.ts           # Helper functions
└── types/index.ts         # TypeScript types
```

## Roles

| Role | Kemampuan |
|------|-----------|
| `admin` | Semua akses + kelola user + approve closure |
| `risk_manager` | Buat/edit risk, mitigasi, review, request closure |
| `viewer` | Read-only |

Set role via Supabase SQL Editor:
```sql
update avr_user_profiles set role = 'admin' where email = 'you@company.com';
```

## Deploy ke Vercel

1. Push repo ke GitHub
2. Import di [vercel.com](https://vercel.com)
3. Tambahkan environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
