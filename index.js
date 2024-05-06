const express = require('express');
const app = express();
const mongoose = require('mongoose');
const User = require('./model/user');
const bcrypt = require('bcrypt');
const session = require('express-session');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

mongoose.connect('mongodb://127.0.0.1:27017/auth-D')
  .then(() => console.log('Connected to MongoDB!'));

let isLoggedIn = (req, res, next) => {
    if (req.session.username) {
        next();
    } else {
        res.redirect('/login');
    }
};

app.get('/', isLoggedIn, (req, res) => {
    res.render('home');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    const { username, password, email } = req.body;
    // Check for existing user using 'await' and fix the bcrypt hashing issue
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        res.redirect('/signup');
    } else {
        const hashPassword = await bcrypt.hash(password, 10);
        await User.create({ username, password: hashPassword, email });
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    // Check for user and compare passwords using 'await' to handle promises
    const user = await User.findOne({ username });
    if (user) {
        let check = await bcrypt.compare(password, user.password);
        if (check) {
            req.session.username = username;
            res.redirect('/');
        } else {
            res.redirect('/login');
        }
    } else {
        res.redirect('/signup');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});
app.get('/', isLoggedIn, async (req, res) => {
    const user = await User.findOne({ username: req.session.username });
    res.render('home', { username: user.username, email: user.email });
});


app.listen(4000, () => {
    console.log('Server running at port 4000');
});
