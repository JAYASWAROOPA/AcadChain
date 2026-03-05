console.log('Checkpoint 1: Imports starting');
const express = require('express');
console.log('Checkpoint 2: Express loaded');
const mongoose = require('mongoose');
console.log('Checkpoint 3: Mongoose loaded');
const dotenv = require('dotenv');
console.log('Checkpoint 4: Dotenv loaded');
const cors = require('cors');
console.log('Checkpoint 5: Cors loaded');

dotenv.config();
console.log('Checkpoint 6: Dotenv configured');

const app = express();
console.log('Checkpoint 7: App created');
app.use(cors());
app.use(express.json());
console.log('Checkpoint 8: Middleware added');

app.get('/', (req, res) => res.send('OK'));

app.listen(5000, () => console.log('Server OK'));
