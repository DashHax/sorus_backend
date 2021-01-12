const crypto = require("crypto");
const salt = "rHfW0XDUuY+yM1JoILESsliOwgowwroe8FmanszrkJzkMr/ZkLOp0XaWb7jIXLHPNPFPrHpQNJ02viERNSNzhg==";

/**
 * 
 * @param {string} password 
 */
function hashPassword(password) {
    let hash = crypto.createHmac("sha512", salt);
    return hash.update(password).digest().toString("hex");
}

function rndStr(length = 10) {
    let raw = crypto.randomBytes(length * 2).toString("base64");
    raw = raw.split("").filter(c => ['/', '=', '+'].indexOf(c) == -1).join("");
    raw = raw.substr(0, length);
    return raw;
}

module.exports = {
    hashPassword, rndStr
}