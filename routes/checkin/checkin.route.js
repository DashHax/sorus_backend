const express = require("express");

const db = require("../../database");
const faces = require("../../controllers/faces/faces.controller");
const { err } = require("../helper");
const config = require("../../config");
const jwt = require("jsonwebtoken");

const route = express.Router();

route.post("/login", async (req, res) => {
    try {
        let { pin, face } = req.body;

        let find = await db("pui_lists").where({ login_id: pin }).select("id", "fullname", "icno", "contactno");
        if (find.length == 0) return err(res, { error: "Invalid PIN!" });

        let user = find[0];
        let userID = user.id;

        let dist = faces.findDistance(userID, face);
        if (dist >= config.Infer.Threshold) {
            console.log(`${userID} login at ${dist} similarity`)

            let payload = { puiID: userID, puiPIN: pin, rnd: Math.round(Math.random() * Number.MAX_SAFE_INTEGER) }
            let token = jwt.sign(payload, config.JWT.accessKey, { expiresIn: "24h" });

            return res.json({ status: "success", token, user: {  id: user.id, name: user.fullname }});
        } else {
            return err(res, { error: "PIN Mismatch!" });
        }

    } catch (error) {
        return err(res, { error: error.message });
    }
})

module.exports = {
    path: '/checkin',
    route    
}