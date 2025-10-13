const express = require('express');
const path = require('path');

const app = express();

// Konfigūracija
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static(path.join(__dirname, 'public')));

// Globalūs kintamieji
app.locals.menu = [
    { title: 'Pradžia', link: '/' },
    { title: 'Žaislai', link: '/toys' },
    { title: 'Žaislų nuoma', link: '/toy-rent' },
    { title: 'Tinklaraštis', link: '/blog' },
    { title: 'Kontaktai', link: '/contact' },
];

// Maršrutai
const blogRoutes = require('./src/routes/blogRoutes');
app.use('/blog', blogRoutes);

// Pagrindiniai puslapiai
app.get('/', (req, res) => {
    res.render('pages/index', { title: 'Žaislų Pasaulis' });
});

app.get('/toys', (req, res) => {
    res.render('pages/toys', { title: 'Žaislai' });
});

app.get('/toy-rent', (req, res) => {
    res.render('pages/toy-rent', { title: 'Žaislų nuoma' });
});

app.get('/contact', (req, res) => {
    res.render('pages/contact', { title: 'Kontaktai' });
});

app.get('/services', (req, res) => {
    res.render('pages/services', { title: 'Paslaugos' });
});

// 404 klaidos apdorojimas
app.use((req, res) => {
    res.status(404).render('errors/404', { title: 'Puslapis nerastas' });
});

app.listen(3000, () => {
    console.log('Serveris veikia: http://localhost:3000');
});
