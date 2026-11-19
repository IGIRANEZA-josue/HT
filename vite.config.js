
import { defineConfig } from 'vite';

export default defineConfig({
    root: 'public',

    // Your images are already inside public/images.
    publicDir: false,

    server: {
        port: 5173,

        proxy: {
            '/users': 'http://localhost:7000',
            '/admins': 'http://localhost:7000',
            '/properties': 'http://localhost:7000',
            '/locations': 'http://localhost:7000',
            '/rentalrequests': 'http://localhost:7000',
            '/favorites': 'http://localhost:7000',
            '/messages': 'http://localhost:7000',
            '/appointments': 'http://localhost:7000',
            '/notifications': 'http://localhost:7000'
        }
    }
});
