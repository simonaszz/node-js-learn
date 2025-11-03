# NodeJS Blog (Express + EJS + MongoDB)

## Greitas startas

1) Reikalavimai
- Node.js 18+
- MongoDB (Atlas arba lokaliai)

2) Aplinka (`.env`)

Sukurk `.env` projekto šaknyje:
```
MONGO_URI=mongodb+srv://<vartotojas>:<slaptazodis>@<cluster>/<db>?retryWrites=true&w=majority
SESSION_SECRET=labai_saugus_slaptas_raktas
```

3) Diegimas ir paleidimas
```bash
npm install
npm start
# arba
node app.js
```

4) Naudingi URL
- Pagrindinis: http://localhost:3000/
- Tinklaraštis: http://localhost:3000/blog
- Skydelis (prisijungusiems): http://localhost:3000/dashboard
- Prisijungimas: http://localhost:3000/login
- Registracija: http://localhost:3000/register

## Autentikacija ir RBAC

- Sesijos su `express-session` + `connect-mongo`. Į `req.session.user` įrašoma `{ id, email, role }`.
- `User` schema turi `role: 'user' | 'admin'`.
- Vienas įėjimo taškas į valdymą – `/dashboard` visiems prisijungusiems.
- Admin-only maršrutai (Blog kūrimas/redagavimas/trynimas) saugomi `requireAuth` + `requireAdmin`.

### Suteikti admin rolę esamam vartotojui

Variantas A (mongosh viena eilutė):
```bash
mongosh "$MONGO_URI" --eval 'db.users.updateOne({ email: "tavo@pastas.lt" }, { $set: { role: "admin" } })'
```

Variantas B (mongosh interaktyviai):
```bash
mongosh "$MONGO_URI"
# tada:
db.users.updateOne({ email: "tavo@pastas.lt" }, { $set: { role: "admin" } })
```

Po pakeitimo atsijunk/prisijunk aplikacijoje, kad sesijoje atsinaujintų `role`.

## Maršrutai (trumpai)

- `/blog` – sąrašas (vieša)
- `/blog/:id` – detalė (vieša)
- `/blog/create` – forma (tik admin)
- `/blog/:id/edit` – redagavimas (tik admin)
- `DELETE /blog/:id` – trynimas (tik admin; JSON)
- `/dashboard` – bendras skydelis (reikia prisijungti)
- `/account` – profilio atnaujinimas (reikia prisijungti)
- `/login`, `/register`, `/logout` – autentikacija

## Struktūra (santrauka)

- `app.js` – Express konfigūracija, sesijos, EJS, routerių registracija
- `src/routes/` – `AuthRouter`, `AccountRouter`, `AdminRouter`, `BlogRouter`, `api`
- `src/controllers/` – Controller klasės (HTTP sluoksnis)
- `src/services/` – verslo logika (AuthService, AccountService, BlogService)
- `src/models/` – Mongoose modeliai (`User`, `Blog`, `BlogComment`)
- `src/middleware/` – `requireAuth`, `requireAdmin`, `logger`
- `views/` – EJS šablonai

## Pastabos
- `.env` nekelti į Git (jau ignoruojamas `.gitignore`).
- Login/register formos rodo klaidas, UI turi paprastą „fade“ perėjimą.
- Prie API (komentarai) grąžinamas JSON.
