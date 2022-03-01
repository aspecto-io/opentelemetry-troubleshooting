require('./tracing.ts');
import express from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';

// mongoose (mongodb ORM) schema and model
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: Number,
});
const User = mongoose.model('User', userSchema);

// connect to mongodb
(async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/otel-troubleshooting');
        console.log('connected to mongodb');    
    } catch(err) {
        console.log('failed connecting to mongodb', err);
    }
})();

let redisClient: any;
// connect to redis
(async () => {
    try {
        redisClient = createClient();
        await redisClient.connect();
        console.log('connected to redis');
    } catch (err) {
        console.log('failed to connect to redis', err);
    }
})();

// http endpoints
const app = express();
app.use(express.json());
app.get('/users', async (req, res: express.Response) => {
    try {
        res.json(await User.find());
    } catch(err) {
        console.log('failed getting all users', err);
        res.sendStatus(500);
    }
});
app.post('/users', async (req, res: express.Response) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        await redisClient.incr('users_count');
        res.sendStatus(200);    
    } catch (err) {
        console.log('failed creating new user', err);
        res.sendStatus(500);
    }
});
app.listen(3000, () => console.log('app started on port 3000'));