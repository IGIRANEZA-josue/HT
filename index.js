
require('dotenv').config();

const express = require('express');
const path = require('path');

<<<<<<< HEAD
=======
const Urouter = require('./routes/authRoutes.js');
const Arouter = require('./routes/adminroutes.js');
const propertyRouter = require('./routes/propertyRoutes.js');

>>>>>>> f1f2fb4353e8d576fd0d71418caf6aacf8cfa5ca
const PORT = process.env.PORT || 7000;

const app = express();

app.use(express.json());

<<<<<<< HEAD

// IMPORT ROUTES
const Urouter = require('./routes/authRoutes.js');
const Arouter = require('./routes/adminroutes.js');
const Prouter = require('./routes/propertyRoutes.js');
const Lrouter = require('./routes/locationRoutes.js');
const Rrouter = require('./routes/rentalRoutes.js');
const Frouter = require('./routes/favoriteRoutes.js');
const Mrouter = require('./routes/messageRoutes.js');
const Aproter = require('./routes/appointmentRoutes.js');
const Nrouter = require('./routes/notificationRoutes.js');


// HOME ROUTE
app.get('/', (req, res) => {
    res.send('Welcome to my H-TRACKER application');
});
=======
// Frontend and property API share an origin.
app.use(express.static(path.join(__dirname, 'public')));
app.use('/properties', propertyRouter);
>>>>>>> f1f2fb4353e8d576fd0d71418caf6aacf8cfa5ca


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
