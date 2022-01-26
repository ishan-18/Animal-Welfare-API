const express = require('express');
const dotenv = require('dotenv');

dotenv.config({path: './config/config.env'});

const app = express();


app.get('/', async (req,res)=>{
    try {
        res.status(200).json({msg: "Hello"});
    } catch (err) {
        return res.status(500).json({err: err.message});
    }
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
    console.log(`Server Listening in ${process.env.NODE_ENV} on port ${process.env.PORT}`)
})