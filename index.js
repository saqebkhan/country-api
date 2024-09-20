const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, 'images')));

const dataFilePath = './data.json'; // Your data file path
const upload = multer({ 
    dest: 'images/',
    limits: { fileSize: 4 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Only .jpg and .png files are allowed!'), false);
        }
    }
});

// Load countries from data file
const loadCountries = () => {
    if (!fs.existsSync(dataFilePath)) return { countries: [] };
    return JSON.parse(fs.readFileSync(dataFilePath));
};

// Get all countries
app.get('/countries', (req, res) => {
    res.json(loadCountries().countries);
});

// Get country by name
app.get('/country/:name', (req, res) => {
    const countries = loadCountries().countries;
    const country = countries.find(c => c.name === req.params.name);
    res.json(country || {});
});

// Add a new country
app.post('/country', upload.single('image'), (req, res) => {
    const { name, rank, continent } = req.body;
    const countries = loadCountries().countries;

    // Server-side validation
    const isNameUnique = !countries.some(c => c.name === name);
    const isRankUnique = !countries.some(c => c.rank == rank);
    
    if (!isNameUnique || !isRankUnique) {
        return res.status(400).json({
            error: "Country name and rank must be unique",
        });
    }

    const newCountry = {
        name,
        continent,
        flag: req.file ? `images/${req.file.filename}` : null,
        rank: Number(rank)
    };

    countries.push(newCountry);
    fs.writeFileSync(dataFilePath, JSON.stringify({ countries }));
    res.status(201).json(newCountry);
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
