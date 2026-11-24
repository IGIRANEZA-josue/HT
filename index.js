
require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 7000;

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// FRONTEND FILES
app.use(express.static(path.join(__dirname, 'public')));

// UPLOADED IMAGES
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// IMPORT ROUTES
const Urouter = require('./routes/authRoutes');
const Arouter = require('./routes/adminroutes');
const Prouter = require('./routes/propertyRoutes');
const Lrouter = require('./routes/locationRoutes');
const Rrouter = require('./routes/rentalRoutes');
const Frouter = require('./routes/favoriteRoutes');
const Mrouter = require('./routes/messageRoutes');
const Aproter = require('./routes/appointmentRoutes');
const Nrouter = require('./routes/notificationRoutes');

// HOME ROUTE
app.get('/api', (req, res) => {
    res.send('Welcome to my H-TRACKER application');
});

// USER ROUTES
app.use('/users', Urouter);

// ADMIN ROUTES
app.use('/admins', Arouter);

// PROPERTY ROUTES
app.use('/properties', Prouter);

// LOCATION ROUTES
app.use('/locations', Lrouter);

// RENTAL REQUEST ROUTES
app.use('/rentalrequests', Rrouter);

// FAVORITE ROUTES
app.use('/favorites', Frouter);

// MESSAGE ROUTES
app.use('/messages', Mrouter);

// APPOINTMENT ROUTES
app.use('/appointments', Aproter);

// NOTIFICATION ROUTES
app.use('/notifications', Nrouter);

// START SERVER
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
