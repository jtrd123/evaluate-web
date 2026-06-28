# คู่มือ Deploy บน Linux Server (Self-hosted)

## สถาปัตยกรรม — 1 Stack, 8 Containers

```
docker compose up -d   ← คำสั่งเดียวรันทุกอย่าง

School Stack
├── db        (PostgreSQL)       port 5432  — ภายใน stack เท่านั้น
├── auth      (GoTrue)           port 9999  — ภายใน stack เท่านั้น
├── rest      (PostgREST)        port 3000  — ภายใน stack เท่านั้น
├── storage   (Storage API)      port 5000  — ภายใน stack เท่านั้น
├── meta      (pg-meta)          port 8080  — ภายใน stack เท่านั้น
├── kong      (API Gateway)      port 8000  ✅ เปิดสู่ภายนอก
├── studio    (Supabase Studio)  port 8080  ⚠️  ปิดจาก internet
└── app       (Next.js)          port 3000  ✅ เปิดสู่ภายนอก (เว็บหลัก)
```

---

## ข้อกำหนด Server

| รายการ | ขั้นต่ำ | แนะนำ |
|--------|---------|-------|
| RAM | 2 GB | 4 GB |
| CPU | 2 cores | 4 cores |
| Disk | 20 GB | 50 GB |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Docker | 24+ | 24+ |
| Docker Compose | v2 | v2 |

---

## ขั้นตอนที่ 1 — ติดตั้ง Docker

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# logout แล้ว login ใหม่ จากนั้นตรวจสอบ
docker --version
docker compose version
```

---

## ขั้นตอนที่ 2 — Clone โปรเจกต์

```bash
git clone https://github.com/YOUR_ORG/school-evaluation.git
cd school-evaluation
```

---

## ขั้นตอนที่ 3 — ตั้งค่า Environment

```bash
cp .env.docker.example .env.docker
nano .env.docker
```

แก้ค่าทุกตัวที่มี `YOUR_`:

```env
SERVER_HOST=http://192.168.1.100     # IP server ของรร.
POSTGRES_PASSWORD=ตั้งรหัสผ่านแข็งแกร่ง
JWT_SECRET=สุ่มตัวอักษร32ตัวขึ้นไป
DASHBOARD_PASSWORD=รหัสเข้า Supabase Studio
```

### Generate API Keys

เปิด browser ไปที่ลิงก์นี้:
`https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys`

1. ใส่ `JWT_SECRET` ที่ตั้งไว้
2. Copy **anon key** → ใส่ใน `SUPABASE_ANON_KEY`
3. Copy **service_role key** → ใส่ใน `SUPABASE_SERVICE_ROLE_KEY`

---

## ขั้นตอนที่ 4 — รัน Stack

```bash
# รันครั้งแรก (ดึง Docker images ~5-10 นาที)
docker compose --env-file .env.docker up -d

# ดูสถานะ containers ทั้งหมด
docker compose ps

# ดู logs แบบ real-time
docker compose --env-file .env.docker logs -f
```

ผลลัพธ์ที่ควรเห็น (ทุกตัว Status = running):
```
NAME        IMAGE                    STATUS
db          supabase/postgres        running (healthy)
auth        supabase/gotrue          running
rest        postgrest/postgrest      running
storage     supabase/storage-api     running
meta        supabase/postgres-meta   running
kong        kong                     running
studio      supabase/studio          running
app         school-eval-app          running
```

---

## ขั้นตอนที่ 5 — Import Database Schema

**ครั้งแรกเท่านั้น** — รันหลังจาก `db` container ขึ้นมาแล้ว:

```bash
# รัน schema หลัก
docker compose exec db psql -U postgres -d postgres \
  -f /docker-entrypoint-initdb.d/schema.sql

# หรือ copy ไฟล์เข้า container แล้วรัน
docker cp supabase/schema.sql school-evaluation-db-1:/tmp/schema.sql
docker compose exec db psql -U postgres -d postgres -f /tmp/schema.sql

docker cp supabase/additions.sql school-evaluation-db-1:/tmp/additions.sql
docker compose exec db psql -U postgres -d postgres -f /tmp/additions.sql
```

**วิธีง่ายกว่า** — เปิด Supabase Studio แล้วทำผ่าน SQL Editor:
```
http://SERVER_IP:8080
```
login ด้วย `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`
→ SQL Editor → วาง schema.sql → Run → วาง additions.sql → Run

---

## ขั้นตอนที่ 6 — สร้าง Admin User คนแรก

เข้า Supabase Studio (`http://SERVER_IP:8080`):

1. **Authentication → Users → Add user**
   - Email: admin@school.ac.th
   - Password: ตั้งรหัสผ่าน
   - จด **UUID** ที่ได้

2. **SQL Editor** → รัน:
```sql
INSERT INTO public.profiles (id, full_name, role, school_id)
VALUES ('uuid-ที่ได้-จาก-ขั้นตอน-1', 'ชื่อผู้ดูแล', 'admin', 'SCH001');
```

---

## ขั้นตอนที่ 7 — ตรวจสอบ

```bash
# เว็บหลัก
curl http://SERVER_IP:3000

# Supabase API
curl http://SERVER_IP:8000/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"
```

เปิด browser:
- เว็บระบบ: `http://SERVER_IP:3000`
- Supabase Studio: `http://SERVER_IP:8080` (ใช้ภายในเท่านั้น)

---

## การ Update โค้ดใหม่

เมื่อแก้ไขโค้ดแล้ว push ขึ้น GitHub:

```bash
# บน server
cd school-evaluation
git pull

# Rebuild เฉพาะ Next.js container (ไม่กระทบ database)
docker compose --env-file .env.docker up -d --build app

# ตรวจสอบ
docker compose logs -f app
```

---

## Firewall (แนะนำให้ตั้ง)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3000/tcp  # Next.js (เว็บหลัก)
sudo ufw allow 8000/tcp  # Supabase API
sudo ufw deny  5432/tcp  # PostgreSQL — ปิดจาก internet
sudo ufw deny  8080/tcp  # Studio — ปิดจาก internet
sudo ufw enable
```

---

## Backup ฐานข้อมูล

```bash
# Backup
docker compose exec db pg_dump -U postgres postgres \
  > backup_$(date +%Y%m%d_%H%M).sql

# Restore
cat backup_20260101_0200.sql | docker compose exec -T db \
  psql -U postgres postgres
```

### ตั้ง Cron backup อัตโนมัติทุกวัน 02:00 น.

```bash
crontab -e

# เพิ่มบรรทัดนี้ (แก้ path ให้ตรง):
0 2 * * * cd /home/ubuntu/school-evaluation && docker compose exec db pg_dump -U postgres postgres > /home/ubuntu/backups/backup_$(date +\%Y\%m\%d).sql
```

---

## Troubleshooting

```bash
# ดู logs container ใดก็ได้
docker compose logs -f db
docker compose logs -f auth
docker compose logs -f app

# restart container เดียว
docker compose restart app

# หยุด/รัน stack ทั้งหมด
docker compose --env-file .env.docker down
docker compose --env-file .env.docker up -d
```

| อาการ | ตรวจสอบ |
|-------|---------|
| เว็บขึ้น "Failed to fetch" | `docker compose logs auth` — auth ยังไม่ขึ้น |
| Login ไม่ได้ | ตรวจ `JWT_SECRET` ใน `.env.docker` |
| รูปภาพไม่แสดง | ตรวจ `SERVER_HOST` ต้องตรงกับ IP จริง |
| Studio เข้าไม่ได้ | `docker compose logs studio` |
