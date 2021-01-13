const express = require("express");

const db = require("../../database");
const faces = require("../../controllers/faces/faces.controller");
const { err } = require("../helper");
const config = require("../../config");
const jwt = require("jsonwebtoken");

const { insideCircle } = require("geolocation-utils");
const { trace } = require("console");

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
        if (tokenPayload.puiPIN != id) return err(res, { error: "Invalid token!", l: 1});

        let search = await db("pui_lists").innerJoin("locations", "locations.pui_id", "pui_lists.id").where({ login_id: id })
                            .select("pui_lists.id AS pui_ID", 
                                    "locations.lat AS lat2", "locations.long", "locations.radius").limit(1);
        if (search.length == 0) return err(res, { error: "Invalid token! ", l: 2});

        let pui = search[0];
        console.log(pui, tokenPayload);

        if (pui.pui_ID != tokenPayload.puiID) return err(res, {error : "Invalid token!", l: 3});

        let dist = faces.findDistance(tokenPayload.puiID, face);
        if (dist < config.Infer.Threshold) return err(res, { error: "Identity mismatch! Please try again!" });

        let r_h = histograms.right,
            l_h = histograms.left;

        let r_k = Object.keys(r_h), l_k = Object.keys(l_h);
        let r_alive = r_k.filter(k => {
            let parts = k.split(":").map(p => parseInt(p));
            return parts[0] < 100 && parts[1] < 150;
        });
        let l_alive = l_k.filter(k => {
            let parts = k.split(":").map(p => parseInt(p));
            return parts[0] < 100 && parts[1] < 150;
        });

        console.log(`id=${pui.pui_ID}, left=${l_alive.length}, right=${r_alive.length}`);

        if (r_alive.length == 0 && l_alive.length == 0) return err(res, { error: "Aliveness Test failed! Please try again! "});

        let { acc, lat: lat1, lng } = location;
        let { lat2, long, radius } = pui;

        let isBounded = insideCircle({ lat: parseFloat(lat1), lon: parseFloat(lng) }, { lat: parseFloat(lat2), lon: parseFloat(long) }, radius + (acc / 2));
        
        await db("checkins").insert({
            pui: pui.pui_ID,
            checked_time: new Date(),
            lat: lat1,
            long: lng,
            inside: isBounded ? 1 : 0
        });

        tokenPayload.rnd = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
        let newToken = jwt.sign(tokenPayload, config.JWT.accessKey);

        return res.json({ status: "success", token: newToken });

    } catch (error) {
        return err(res, { error: error.message });
    }
});

route.get("/view/:token/:pin", async (req, res) => {
    try {
        let { token, pin } = req.params;
        let payload = jwt.verify(token, config.JWT.accessKey);

        if (payload.puiPIN != pin) return err(res, { error: "Invalid token!", l: 1});

        let search = await db("pui_lists").where({ login_id: pin }).select("id").limit(1);
        if (search.length == 0) return err(res, { error: "Invalid PIN!" });
        let pui = search[0];

        let checkins = await db("checkins").where({ pui: pui.id }).select("*");

        let result = checkins.map(chk => {
            return {
                time: chk.checked_time,
                lat: parseFloat(chk.lat),
                long: parseFloat(chk.long),
                inbound: chk.inside == 1
            }
        });

        return res.json({ status: "success", checkins: result });
    } catch (error) {
        return err(res, { error: error.message })
    }
});

module.exports = {
    path: '/checkin',
    route    
}