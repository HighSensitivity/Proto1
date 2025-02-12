const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

const BOOKINGS_FILE = 'bookings.json';

// Get all bookings
app.get('/api/bookings', async (req, res) => {
    try {
        const data = await fs.readFile(BOOKINGS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        if (error.code === 'ENOENT') {
            // If file doesn't exist, return empty array
            res.json([]);
        } else {
            res.status(500).json({ error: 'Error reading bookings' });
        }
    }
});

// Add new booking
app.post('/api/bookings', async (req, res) => {
    try {
        let bookings = [];
        try {
            const data = await fs.readFile(BOOKINGS_FILE, 'utf8');
            bookings = JSON.parse(data);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }

        bookings.push(req.body);
        await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
        res.json({ message: 'Booking added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error saving booking' });
    }
});

// Add this near your other endpoints
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    // Check against default credentials
    if (username === 'admin' && password === 'password123') {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

const PORT = 5500;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 