
require('dotenv').config();

const express = require('express');

const Urouter = require('./routes/authRoutes.js');
const Arouter = require('./routes/adminroutes.js');

const PORT = process.env.PORT || 7000;

const app = express();

app.use(express.json());

// HOME ROUTE
app.get('/', (req, res) => {
    res.send('Welcome to my H-TRACKER application');
});

// USER ROUTES
app.use('/users', Urouter);

// ADMIN ROUTES
app.use('/admins', Arouter);

// START SERVER
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
