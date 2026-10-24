# 🏮 Thadingyut Festival Lucky Spin Wheel (သီတင်းကျွတ် ကံစမ်းမဲ)

A production-ready Next.js 16 web application designed for MikroTik Hotspot captive portals. Users are automatically redirected to this app with their `mac`, `ip`, and cryptographic signature (`sig`) in the query parameters.

---

## 🚀 Features

- **Anti-Cheat & Security**:
  - **URL Signature Verification**: Validates `md5(mac + ip + HOTSPOT_SECRET) === sig` to prevent URL tampering.
  - **One Spin Per User (Dual Lock)**: Checks both `mac_address` in the database AND an HTTP-Only cookie `tdg_device_token` to prevent MAC randomization bypass.
  - **Concurrency & Race Conditions**: Atomic database transactions with row-level locking (`FOR UPDATE`) when decrementing remaining prize quantities.
- **Fair Weighted Selection**:
  - Probability weighting based on available inventory (`remaining_qty > 0`).
- **Interactive HTML5 Canvas Wheel**:
  - Burmese Thadingyut festival theme (lanterns, warm gold, deep red/orange).
  - Smooth 4-second cubic-bezier ease-out rotation landing exactly on the winning slice returned by the server.
  - `canvas-confetti` celebration on real prize wins.
  - Unique Redeem Code generation (`TDG-XXXXX`).
- **Admin Dashboard (`/admin`)**:
  - Password protected via `ADMIN_PASSWORD`.
  - Live Prize Pool inventory management (add, edit quantities/weight/color, delete).
  - Searchable Spin Logs (by Redeem Code or MAC) with one-click "Mark Redeemed" action.
- **Database**:
  - Vercel Postgres / PostgreSQL with Drizzle ORM and automatic migration scripts.

---

## 📦 Tech Stack

- **Framework**: Next.js 16 (App Router, Server Actions)
- **Database**: Vercel Postgres (`@vercel/postgres`, `drizzle-orm`, `drizzle-kit`)
- **Styling**: Tailwind CSS, Lucide React
- **Animations**: Custom HTML5 Canvas + `canvas-confetti`

---

## 🛠️ Environment Variables

Create `.env.local` or set in Vercel:

```bash
# Vercel Postgres connection string
POSTGRES_URL=postgres://user:password@host:5432/dbname

# Shared secret configured in MikroTik alogin.html
HOTSPOT_SECRET=your_mikrotik_shared_secret_here

# Admin dashboard login password
ADMIN_PASSWORD=your_admin_password_here

# Local development bypass (skip MD5 signature verification)
DEV_MODE=true
```

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate and Apply Database Migrations
```bash
npm run db:generate
npm run db:push
```

### 3. Seed Initial Thadingyut Prizes
```bash
npm run db:seed
```
*(Alternatively, call `POST /api/seed?secret=YOUR_ADMIN_PASSWORD`)*

### 4. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000/spin?mac=7E:92:9B:1E:A4:0B&ip=10.10.11.254&sig=dev](http://localhost:3000/spin?mac=7E:92:9B:1E:A4:0B&ip=10.10.11.254&sig=dev) to test the spin wheel.

Visit [http://localhost:3000/admin](http://localhost:3000/admin) to manage prizes and redeem codes.

---

## 📡 MikroTik Hotspot Integration

Place `mikrotik/alogin.html` inside your MikroTik router's hotspot directory:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Logging in...</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js"></script>
</head>
<body>
  <script>
    var mac = '$(mac)';
    var ip  = '$(ip)';
    var SECRET = 'your_mikrotik_shared_secret_here';
    var APP_URL = 'https://your-domain.vercel.app';
    
    var sig = md5(mac + ip + SECRET);
    var redirectUrl = APP_URL + '/spin'
      + '?mac=' + encodeURIComponent(mac)
      + '&ip='  + encodeURIComponent(ip)
      + '&sig=' + encodeURIComponent(sig);

    setTimeout(function() {
      window.location.href = redirectUrl;
    }, 1500);
  </script>
</body>
</html>
```
