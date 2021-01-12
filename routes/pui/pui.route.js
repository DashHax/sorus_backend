const { json } = require("express");
const express = require("express");
const jwt = require("jsonwebtoken");

const db = require("../../database");
const config = require("../../config");
const { rndStr } = require("../../crypto");
const { err } = require("../helper");

const faceController = require("../../controllers/faces/faces.controller");

const authMiddleware = require("./pui.middleware");

const route = express.Router();

function generateLoginID(parts = 3, countPerParts = 3) {
    let _parts = [];
    for (let i = 0; i < parts; i++) {
        _parts.push(rndStr(countPerParts).toUpperCase());
    }

    return _parts.join("");
}

route.use(authMiddleware);

route.get("/list/:page?/:count?", async (req, res) => {
    
    let page = req.params.page || 0;
    let count = req.params.count || 10;

    try {
        let puis = page == 0 ? 
                    await db("pui_lists").innerJoin("locations", "locations.pui_id", "pui_lists.id").innerJoin("admissions", "admissions.pui", "pui_lists.id")
                        .select("pui_lists.id", "fullname", "admission_date", "duration", "unit", "description", "login_id") : 

                    await db("pui_lists").innerJoin("locations", "locations.pui_id", "pui_lists.id").innerJoin("admissions", "admissions.pui", "pui_lists.id")
                        .select("pui_lists.id", "fullname", "admission_date", "duration", "unit", "description", "login_id").limit(count).offset(count * page);
        
        let result = puis.map(item => {
            let admitDate = new Date(item.admission_date);
            let duration = parseInt(item.duration);
            let unit = item.unit;

            if (unit == "days") {
                let one_day = 60 * 60 * 24;
                duration = duration * one_day;
            }

            let releaseDate = new Date();
            releaseDate.setTime(admitDate.getTime() + duration * 1000);
            
            let delta = releaseDate - (new Date())

            return {
                id: item.id,
                name: item.fullname,
                address: item.description,
                admitted: admitDate,
                release: releaseDate,
                login_id: item.login_id,
                delta: delta / 1000
            }
        })

        return res.json({ status: "success", pui: result});


    } catch (error) {
        return err(res, { error });
    }

    return res.json({status: "success", pui: [ 
        { id: "1234", name: "O'Dell Obrien Gapitar", address: "A-1F-2, Taman Vista Seri Kiranau, Jalan Inobong-Putaton-Bansadon, 89500, Kota Kinabalu, Sabah", delta: 1 * 24 * 60 * 60 }
    ]});
})

route.post("/new", async (req, res) => {
    try {
        let {   contactno, // "+60146480059"
                faces, // [Float32Array(128), Float32Array(128), Float32Array(128), Float32Array(128), Float32Array(128)]
                fullname, // "O'Dell Obrien Gapitar"
                icno, // "970203125207"
                local, // true
                locationAddress, // "Kiranau"
                locationLatitude, // 5.909687861187084
                locationLongitude, // 116.12469327459623
                locationName, // "Rumah"
                locationRadius, // 25
                nationality, // "MY",
                admitDate,
                admitDuration
            } = req.body;

        let adminID = req.user.info.id;

        console.log(adminID);

        let puiID = rndStr(16);
        let locationID = rndStr(16);
        let admitID = rndStr(16);
        
        let login_id = generateLoginID();

        await db.transaction(async transaction => {
            await transaction("pui_lists").insert({
                id: puiID,
                fullname: fullname,
                icno: icno,
                contactno: contactno,
                local: local == true ? 1 : 0,
                nationality: nationality,
                login_id
            });

            await transaction("locations").insert({
                id: locationID,
                name: locationName,
                description: locationAddress,
                pui_id: puiID,
                lat: locationLatitude,
                long: locationLongitude,
                radius: locationRadius
            });

            await transaction("admissions").insert({
                id: admitID,
                pui: puiID,
                admitted_by: adminID,
                admission_date: new Date(admitDate),
                duration: admitDuration,
                unit: "days"
            });

            await transaction("admin_updates").insert({
                admin_id: adminID, fields: `pui, locs, admits@id=${puiID}`, action: "create", update_time: new Date()
            });
        });

        faceController.addFace(puiID, faces);

        return res.json({ status: "success", puiID, pin: login_id });
    } catch (error) {
        console.log(error);
        return err(res, { error: error.message });
    }
});

route.post("/update/:puiID", async (req, res) => {
    try {
        let id = req.params.puiID;

        let {   contactno, // "+60146480059"
                faces, // [Float32Array(128), Float32Array(128), Float32Array(128), Float32Array(128), Float32Array(128)]
                fullname, // "O'Dell Obrien Gapitar"
                icno, // "970203125207"
                local, // true
                locationID,
                locationAddress, // "Kiranau"
                locationLatitude, // 5.909687861187084
                locationLongitude, // 116.12469327459623
                locationName, // "Rumah"
                locationRadius, // 25
                nationality, // "MY",
                admitID,
                admitDate,
                admitDuration
            } = req.body;

        let adminID = req.user.info.id;

        console.log(adminID);

        let puiID = id
        
        await db.transaction(async transaction => {
            await transaction("pui_lists").update({
                fullname: fullname,
                icno: icno,
                contactno: contactno,
                local: local == true ? 1 : 0,
                nationality: nationality
            }).where({ id: puiID });

            await transaction("locations").update({
                name: locationName,
                description: locationAddress,
                lat: locationLatitude,
                long: locationLongitude,
                radius: locationRadius
            }).where({ pui_id: puiID, id: locationID });

            await transaction("admissions").update({
                admitted_by: adminID,
                admission_date: new Date(admitDate),
                duration: admitDuration,
                unit: "days"
            }).where({ pui: puiID, id: admitID });

            await transaction("admin_updates").insert({
                admin_id: adminID, fields: "pui, locs, admits", action: "edit", update_time: new Date()
            });
        });

        if (faces.length > 0)
            faceController.addFace(puiID, faces);

        return res.json({ status: "success" });
    } catch (error) {
        console.log(error);
        return err(res, { error: error.message });
    }
})

route.post("/delete", async (req, res) => {
    try {
        let id = req.body.id;

        await db.transaction(async trx => {
            await trx("pui_lists").where({ id: id }).del();
            await trx("admissions").where({ pui: id }).del();
            await trx("locations").where({ pui_id: id }).del();
        });

        faceController.removeIdentity(id, false);

        return res.json({ status: "success" });
    } catch (error) {
        return err(res, { error })
    }
})

route.get("/view/:puiID", async (req, res) => {
    try {
        let id = req.params.puiID;

        let search = await db("pui_lists").innerJoin("locations", "locations.pui_id", "pui_lists.id").innerJoin("admissions", "admissions.pui", "pui_lists.id")
                        .select("pui_lists.id", "pui_lists.fullname", "pui_lists.icno", "pui_lists.contactno", "pui_lists.local", "pui_lists.nationality", "pui_lists.login_id",
                                db.raw("admissions.id as admitID") ,"admissions.admission_date", "admissions.duration",
                                db.raw("locations.id as locationID"), "locations.name", "locations.description", "locations.lat", "locations.long", "locations.radius").where({ "pui_lists.id": id }).limit(1);
        
        if (search.length == 0) return err(res, { error: "Invalid ID!"});
        let user = search[0];

        let result = {
            fullname: user.fullname,
            icno: user.icno,
            contactno: user.contactno,
            local: user.local == 1,
            nationality: user.nationality,
            locationID: user.locationID,
            locationName: user.name,
            locationAddress: user.description,
            locationLatitude: user.lat,
            locationLongitude: user.long,
            locationRadius: user.radius,
            admitID: user.admitID,
            admitDate: user.admission_date,
            admitDuration: user.duration,
            loginID: user.login_id
        };

        return res.json({ status: "success", pui: result });

    } catch (error) {
        return err(res, { error });
    }
})

module.exports = {
    path: '/pui',
    route    
}