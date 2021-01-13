const express = require("express");
const jwt = require("jsonwebtoken");

const config = require("../../config");
const db = require("../../database");
const { hashPassword, rndStr } = require("../../crypto");
const { setKey, getKey } = require("../../jwt.keys");

const { err } = require("../helper");
const { json } = require("express");
const { trace } = require("console");

const route = express.Router();

const accessKey = config.JWT.accessKey; //'v6P9mSp7jhSURWHNuXVqeCcB1iQErhRoP9KPzMKO7zNwbKjhVLYDJjwlN3XW5lwhnRK2CEw++0kpS3Jp2uDBhmxZ6QXiLVN/W8GBuhJDvmzwBpcDsnTiSbOqkKYTV00fKsTY1NjWc3VRWatuBWsB7pmAstWlq3rZjlZFN4FIMWI=';
const refreshKey = config.JWT.refreshKey; //'7qg0BPwvWOPFPChHIoAJxUdgyQkeq4iGuVCIItVoMtNv7Te5kosUnOBKuEQSY6gQsjH5gO/ponalkOVrl1NO5JPnt6UGo/DuL2PcjhqWn3bptdL1rys6DFecoxEQuoX9T2vq2/xpr0mNIvn7cSN/uUCjtHaaF25vq9oxX7TGW4Q=';

/**
 * 
 * @param {string} email 
 * @param {string} password 
 * @param {string} phoneno 
 */
function validateRegistration(email, password, phoneno) {
    let errors = [];
    
    // 1. Check email

    if (email.indexOf("@") == -1 || email.indexOf(".") == -1) {
        errors.push({key: "email", msg: "Invalid email address!"})
    }

    // 2. Check password

    if (password.length < 9) {
        errors.push({ key: "password", msg: "Password must be 9 character and above!" })
    }

    // 3. Check Phone no.

    if (phoneno.indexOf("+60") != 0) {
        errors.push({ key: "phoneno", msg: "Invalid phone number entered! Phone number must be a valid Malaysian phone number with country code (+60)."});
    }

    return errors;
}

route.get("/", async (request, response) => {
    return response.json({hello: "world"});
});

route.post("/login", async (req, res) => {
    try {
        let { username:user, password:pass } = req.body;

        pass = hashPassword(pass);

        let users = await db("users").select(["id", "username", "fullname", "password", "type"]).where({ username: user, password: pass }).limit(1);

        if (users.length == 0) return err(res, { error: "User Not Found!" });

        let userObj = users[0];
        let uid = userObj.id;

        let loginPayload = { id: uid, type: userObj.type };
        let loginAccessToken = jwt.sign(loginPayload, accessKey, { expiresIn: "1h" });
        let refreshAccessToken = jwt.sign(loginPayload, refreshKey, { expiresIn: "2d" });

        setKey(`${uid}.refresh`, refreshAccessToken);

        let uObj = { id: uid, name: userObj.fullname}

        return res.json({ status: "success", user: uObj, token: loginAccessToken });

    } catch (error) {
        return err(res, { error });
    }
});

route.post("/register", async (req, res) => {
    try {
        let { code,fullname,phoneno,email,username,password } = req.body;

        let isAllowed = false;

        let keySearch = await db("regkeys").where({ key: code })
        if (code == "SYSTEMADMIN8383568" || keySearch.length > 0) isAllowed = true;

        if (!isAllowed) return err(res, { error: "Invalid registration code! Please contact system administrator for a valid code. Please note this system is only available to selected frontliners and operators."})
    
        let errors = validateRegistration(email, password, phoneno);

        if (errors.length > 0) {
            let errMsg = errors.map(v => v.msg).join(" ");
            return err(res, { error: errMsg });
        }

        let uid = rndStr(12);
        let dbLoad = {
            id: uid,
            username: username,
            password: hashPassword(password),
            fullname: fullname,
            phoneno: phoneno,
            type: code == "SYSTEMADMIN8383568" ? 1 : 0,
            email: email
        };

        await db("users").insert(dbLoad);
        if (code !== "SYSTEMADMIN8383568" && isAllowed) {
            await db("regkeys").where({ key: code }).del();
        }

        if (req.body.noLogin) return res.json({ status: "success", uid: uid });

        let loginPayload = { id: uid };
        let loginAccessToken = jwt.sign(loginPayload, accessKey, { expiresIn: "1h" });
        let refreshAccessToken = jwt.sign(loginPayload, refreshKey, { expiresIn: "2d" });

        setKey(`${uid}.refresh`, refreshAccessToken);

        return res.json({ status: "success", token: loginAccessToken });
    } catch (error) {
        if (error.code && error.code == 'ER_DUP_ENTRY' && error.sqlMessage.indexOf("users_username_unique")) {
            return err(res, { error: "Username already exist!" });
        }

        return err(res, { error });
    }
});

route.post("/check/:token", async (req, res) => {
    try {
        let { token } = req.params;

        let payload = jwt.verify(token, accessKey);

        return res.json({ status: "success" });
    } catch (error) {
        return err(res, { error });
    }
});

route.get("/keys/:token", async (req, res) => {
    try {
        let { token } = req.params;
        let payload = jwt.verify(token, accessKey);
        if (payload.type != 1) return err(res, { error: "You do not have the permission to create registration codes! "});

        let keys = await db("regkeys").select("key");
        keys = keys.map(item => item.key);
        
        return res.json({ status: "success", keys });
    } catch (error) {
        return err(res, { error });
    }
});

route.post("/keys/new", async (req, res) => {
    try {
        let { token, count } = req.body;

        let payload = jwt.verify(token, accessKey);
        if (payload.type != 1) return err(res, { error: "You do not have the permission to create registration codes! "});

        let keys = [];
        count = count || 1;

        for (let i = 0; i < count; i++) {
            keys.push(rndStr(9));
        }

        await db.transaction(async trx => {
            for (let k of keys) {
                await trx("regkeys").insert({key: k});
            }
        });

        return res.json({ status: "success", keys });

    } catch (error) {
        return err(res, {error});
    }
})

module.exports = {
    path: '/auth',
    route    
}