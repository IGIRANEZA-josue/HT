
const db = require('./db.js');

const createTables = async () => {

    const tables = [

        // 1. Properties
        `CREATE TABLE IF NOT EXISTS properties (
            id INT AUTO_INCREMENT PRIMARY KEY,
            landlord_id INT NOT NULL,
            location_id INT NOT NULL,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            property_type VARCHAR(100) DEFAULT 'House',
            bedrooms INT DEFAULT 0,
            bathrooms INT DEFAULT 0,
            monthly_rent DECIMAL(12,2) NOT NULL,
            status ENUM('available','rented','unavailable')
                DEFAULT 'available',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (landlord_id)
                REFERENCES htracker(id),

            FOREIGN KEY (location_id)
                REFERENCES location(id)

        ) ENGINE=InnoDB`,

        // 2. Property images
        `CREATE TABLE IF NOT EXISTS property_images (
            id INT AUTO_INCREMENT PRIMARY KEY,
            property_id INT NOT NULL,
            image_url VARCHAR(1000) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (property_id)
                REFERENCES properties(id)
                ON DELETE CASCADE

        ) ENGINE=InnoDB`,

        // 3. Rental requests
        `CREATE TABLE IF NOT EXISTS rental_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            property_id INT NOT NULL,
            seeker_id INT NOT NULL,
            message TEXT,
            status ENUM('pending','approved','rejected','cancelled')
                DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (property_id)
                REFERENCES properties(id),

            FOREIGN KEY (seeker_id)
                REFERENCES htracker(id)

        ) ENGINE=InnoDB`,

        // 4. Favorites
        `CREATE TABLE IF NOT EXISTS favorites (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            property_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            UNIQUE KEY unique_favorite (user_id, property_id),

            FOREIGN KEY (user_id)
                REFERENCES htracker(id)
                ON DELETE CASCADE,

            FOREIGN KEY (property_id)
                REFERENCES properties(id)
                ON DELETE CASCADE

        ) ENGINE=InnoDB`,

        // 5. Messages
        `CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sender_id INT NOT NULL,
            receiver_id INT NOT NULL,
            property_id INT,
            message TEXT NOT NULL,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (sender_id)
                REFERENCES htracker(id),

            FOREIGN KEY (receiver_id)
                REFERENCES htracker(id),

            FOREIGN KEY (property_id)
                REFERENCES properties(id)
                ON DELETE SET NULL

        ) ENGINE=InnoDB`,

        // 6. Viewing appointments
        `CREATE TABLE IF NOT EXISTS viewing_appointments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            property_id INT NOT NULL,
            seeker_id INT NOT NULL,
            landlord_id INT NOT NULL,
            appointment_date DATETIME NOT NULL,
            status ENUM('pending','approved','rejected','cancelled','completed')
                DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (property_id)
                REFERENCES properties(id),

            FOREIGN KEY (seeker_id)
                REFERENCES htracker(id),

            FOREIGN KEY (landlord_id)
                REFERENCES htracker(id)

        ) ENGINE=InnoDB`,

        // 7. Notifications
        `CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(200) NOT NULL,
            body TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (user_id)
                REFERENCES htracker(id)
                ON DELETE CASCADE

        ) ENGINE=InnoDB`

    ];

    try {

        for (const sql of tables) {
            await db.query(sql);
        }

        console.log('All 7 additional tables created successfully!');

    } catch (error) {

        console.log('Error creating tables:', error.message);

    }
};

createTables();
