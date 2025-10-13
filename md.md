nodeJS/
├── src/                          # Šaltinio kodas
│   ├── controllers/              # Kontroleriai
│   │   ├── blogController.js
│   │   ├── pageController.js
│   │   └── index.js
│   ├── models/                   # Duomenų modeliai
│   │   └── blogModel.js
│   ├── routes/                   # Maršrutai
│   │   ├── blogRoutes.js
│   │   ├── pageRoutes.js
│   │   └── index.js
│   ├── utils/                    # Pagalbinės funkcijos
│   │   └── slugify.js
│   └── config/                   # Konfigūracija
│       └── express.js
├── public/                       # Statiniai failai
│   ├── css/
│   │   └── style.css
│   ├── js/
│   ├── images/
│   └── assets/
├── views/                        # EJS šablonai
│   ├── pages/
│   │   ├── index.ejs
│   │   ├── blog.ejs
│   │   ├── blog-detail.ejs
│   │   ├── toys.ejs
│   │   ├── toy-rent.ejs
│   │   └── contact.ejs
│   ├── partials/
│   │   ├── head.ejs
│   │   ├── nav.ejs
│   │   ├── footer.ejs
│   │   └── main.ejs
│   └── errors/
│       └── 404.ejs
├── app.js                        # Pagrindinis serverio failas
├── package.json
└── README.md