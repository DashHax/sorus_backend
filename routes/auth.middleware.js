const jwt = require("jsonwebtoken");
const config = require("../config");
const jwtKeys = require("../jwt.keys");

function tryVerify(token, key) {
    try {
        let res = jwt.verify(token, key);
        return { state: true, payload: res };
    } catch (error) {
        console.log(error);
        return { state: false, payload: error };
    }
}

module.exports = async (req, res, next) => {
    req.user = {
        validated: false,
        info: null
    }
    if (!req.headers.authorization) {
        return res.status(498).send("invalid");
    } else {
        let _auth = req.headers.authorization;
        _auth = _auth.split(" ")[1];
        
        let validated = tryVerify(_auth, config.JWT.accessKey);

        if (validated.state == true) {
            let exp = validated.payload.exp;
            let timeNow = Math.ceil(new Date().getTime() / 1000);
            let delta = Math.abs(timeNow - exp);

            if (delta <= 120) {
                let payload = validated.payload;
                let id = payload.id;

                if (!jwtKeys.hasKey(`${id}.refresh`)) {
                    return res.status(498).send("expired");
                }

                let validateRefresh = tryVerify(jwtKeys.getKey(`${id}.refresh`), config.JWT.refreshKey);
                if (validateRefresh.state == false) {
                    return res.status(498).send("expired"); 
                }

                let newToken = jwt.sign(payload, config.JWT.accessKey, { expiresIn: "1h" });
                res.setHeader("Session-Token", newToken);
            }

            req.user.validated = true;
            req.user.info = validated.payload;

            next();
        } else {
            let payload = validated.payload;
            let id = payload.id;

            if (!jwtKeys.hasKey(`${id}.refresh`)) {
                return res.status(498).send("expired");
            }

            let validateRefresh = tryVerify(jwtKeys.getKey(`${id}.refresh`), config.JWT.refreshKey);
            if (validateRefresh.state == false) {
                return res.status(498).send("expired"); 
            }

            let newToken = jwt.sign(payload, config.JWT.accessKey, { expiresIn: "1h" });
            res.setHeader("Session-Token", newToken);

            req.user.validated = true;
            req.user.info = validated.payload;

            next();
        }
    }
}