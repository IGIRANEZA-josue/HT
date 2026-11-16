
require('dotenv').config();

const express = require('express');
const path = require('path');

const Urouter = require('./routes/authRoutes.js');
const Arouter = require('./routes/adminroutes.js');
const propertyRouter = require('./routes/propertyRoutes.js');

const PORT = process.env.PORT || 7000;

const app = express();

app.use(express.json());

// Frontend and property API share an origin.
app.use(express.static(path.join(__dirname, 'public')));
app.use('/properties', propertyRouter);

// USER ROUTES
app.use('/users', Urouter);

// ADMIN ROUTES
app.use('/admins', Arouter);

// START SERVER
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
