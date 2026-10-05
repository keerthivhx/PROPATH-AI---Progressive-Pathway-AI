# 🚀 ProPath AI — How to Run from Scratch

## Step 1 — Open 3 Terminal Windows

Right-click the Start button → **Terminal** (or search "cmd" in Start Menu)
Open it **3 times** — you need 3 separate windows.

---

## Step 2 — Terminal 1: Start Ollama AI

```
ollama serve
```
✅ Keep this window open. You'll see logs appear — that's normal.

---

## Step 3 — Terminal 2: Start Backend

```
cd C:\Users\keert\OneDrive\Desktop\Projects\PROPATH2\backend
node server.js
```
✅ You should see:
```
✅ In-memory MongoDB running
🚀 ProPath AI → http://localhost:5000
🤖 AI Model → qwen2.5:1.5b via Ollama
```

---

## Step 4 — Terminal 3: Start Frontend

```
cd C:\Users\keert\OneDrive\Desktop\Projects\PROPATH2\frontend
npm run dev
```
✅ You should see:
```
VITE v8.3.1  ready in 1531 ms
➜  Local:   http://localhost:5173/
```

---

## Step 5 — Open Browser

Open Chrome/Edge and go to:
```
http://localhost:5173
```

---

## Step 6 — Use the App

1. Click **"Create one"** → Register with Name, Email, Password
2. After login → Click **Domain Assessment**
3. Click **Start AI Assessment →**
4. Answer 10 questions → Qwen AI identifies your career domain
5. Go to **4-Year Roadmap** → Get your personalized plan

---

## ⚠️ Important Rules

| Rule | Why |
|------|-----|
| Keep ALL 3 terminals open | App stops if you close them |
| Start Ollama FIRST | Backend needs it running |
| Register again after restart | Data resets (in-memory DB) |

---

## 🔁 OR — Just Double-Click start.bat

Instead of steps 2-4, just double-click:
```
C:\Users\keert\OneDrive\Desktop\Projects\PROPATH2\start.bat
```
It opens all 3 windows automatically!

---

## ❌ Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "Ollama is not running" | Run `ollama serve` in a terminal |
| Page not loading | Check terminal 3 is running |
| Login not working | Register first (data resets on restart) |
| AI takes 10-20 sec | Normal — AI runs on your CPU |
