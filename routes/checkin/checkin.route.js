const express = require("express");

const db = require("../../database");
const faces = require("../../controllers/faces/faces.controller");
const { err } = require("../helper");
const config = require("../../config");
const jwt = require("jsonwebtoken");

const { insideCircle } = require("geolocation-utils");

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
            let token = jwt.sign(payload, config.JWT.accessKey);

            return res.json({ status: "success", token, user: {  id: user.id, name: user.fullname }});
        } else {
            return err(res, { error: "PIN Mismatch!" });
        }

    } catch (error) {
        return err(res, { error: error.message });
    }
});

route.post("/submit", async (req, res) => {
    try {
        let {
            id,//: localStorage["login_pin"],
            token,//: localStorage["token"],
            location,//: location,
            histograms,//: { left: l_hist, right: r_hist },
            face,//: snappedFace.embedding
        } = req.body;

        let tokenPayload = jwt.verify(token, config.JWT.accessKey);
        if (tokenPayload.puiPIN != id) return err(res, { error: "Invalid token!"});

        let search = await db("pui_lists").innerJoin("locations", "locations.pui_id", "pui_lists.id").where({ login_id: id }).select("*").limit(1);
        if (search.length == 0) return err(res, { error: "Invalid token! "});

        let pui = search[0];
        console.log(pui);

        if (pui.id != tokenPayload.puiID) return err(res, {error : "Invalid token!"});

        let dist = faces.findDistance(tokenPayload.puiID, face);
        if (dist < config.Infer.Threshold) return err(res, { error: "Identity mismatch! Please try again!" });

        let { acc, lat1, lng } = location;
        let { lat2, long, radius } = pui;

        let isBounded = insideCircle({ lat: lat1, lon: lng }, { lat: lat2, lon: long }, radius + (acc / 2));
        

    } catch (error) {
        return err(res, { error: error.message });
    }
});

module.exports = {
    path: '/checkin',
    route    
}