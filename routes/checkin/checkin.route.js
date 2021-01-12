const express = require("express");
const { err } = require("../helper");
const route = express.Router();

route.post("/enter", async (req, res) => {
    try {
        
    } catch (error) {
        return err(res, { error: error.message });
    }
})

module.exports = {
    path: '/checkin',
    route    
}