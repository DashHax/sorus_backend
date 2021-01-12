const fs = require("fs");
const path = require("path");
const glob = require("fast-glob");

const keyPath = path.join(__dirname, "keys")

let keyCollections = new Map();

function setKey(keyName, keyValue) {
    keyCollections.set(keyName, keyValue);

    if (fs.existsSync(keyPath) == false) {
        fs.mkdirSync(keyPath)
    }

    let keyFile = path.join(keyPath, `${keyName}.kd`);
    if (fs.existsSync(keyFile) == false) {
        fs.writeFileSync(keyFile, keyValue);
    }
}

function getKey(keyName) {
    if (keyCollections.has(keyName)) return keyCollections.get(keyName);

    let keyFile = path.join(keyPath, `${keyName}.kd`);
    if (fs.existsSync(keyFile)) {
        let content = fs.readFileSync(keyFile);
        keyCollections.set(keyName, content);
        return content;
    }

    return null;
}

function hasKey(keyName) {
    return keyCollections.has(keyName);
}

function preloadAllKeys() {
    let files = glob.sync(path.join(keyPath, "*.kd"));
    
    for (let file of files) {
        let keyName = path.basename(file, "kd");
        let keyValue = fs.readFileSync(file);

        console.log(`${keyName} = ${keyValue}`);
        keyCollections.set(keyName, keyValue);
    }
}

module.exports = {
    setKey, getKey, preloadAllKeys, hasKey
}