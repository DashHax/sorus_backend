const path = require("path");
const fs = require("fs");
const glob = require("fast-glob");

const config = require("../../config");
const { compare } = require("semver");
const facePath = config.Faces.Path;
const faceLimit = config.Faces.FaceLimit;

/**
 * @type {Map<string, number[][]>}
 */
let identities = new Map();

if (!fs.existsSync(facePath))
    fs.mkdirSync(facePath);

    
let _dist = (a, b) => {
    if (a.length != b.length) return -1;
    let n = a.length;
    let productSum = 0, ssA = 0, ssB = 0;
    for (let i = 0; i < n; i++) {
        productSum += a[i] * b[i];
        ssA += a[i] * a[i];
        ssB += b[i] * b[i];
    }
    return (productSum) / (Math.sqrt(ssA) * Math.sqrt(ssB));
}

function loadFaces() {
    const searchDir = path.join(config.Root, facePath);
    let files = fs.readdirSync(searchDir);
    files = files.filter(item => item.indexOf(".face.json") > -1);

    for (let file of files) {
        let fullname = path.join(searchDir, file);
        let filebase = path.basename(file);
        let id = filebase.replace(".face.json", "");
        let embeddings = JSON.parse(fs.readFileSync(fullname));
        identities.set(id, embeddings);
    }

    /* const facePattern = path.join(config.Root, facePath, "*.face.json");
    const faceFiles = glob.sync(facePattern);

    for (let file of faceFiles) {
        let filebase = path.basename(file);
        let id = filebase.replace(".face.json");
        let embeddings = JSON.parse(fs.readFileSync(file));
        identities.set(id, embeddings);
    }

    console.log(facePattern, faceFiles, fs.readdirSync(path.join(config.Root, facePath))); */
}

function addFace(id, embeddings) {
    let identityPath = path.join(facePath, `${id}.face.json`)
    console.log(embeddings); 

    if (!identities.has(id)) {
        identities.set(id, embeddings)
        fs.writeFileSync(identityPath, JSON.stringify(embeddings));
    } else {
        let inArray = identities.get(id);
        let newItem = [...embeddings, ...inArray];
        if (newItem.length > faceLimit) {
            newItem = newItem.slice(0, faceLimit);
        }

        identities.set(id, newItem);
        fs.writeFileSync(identityPath, JSON.stringify(newItem));
    }
}

function removeIdentity(id, temporary = false) { 
    if (identities.has(id)) {
        identities.delete(id);

        if (!temporary) {
            fs.unlinkSync(path.join(facePath, `${id}.face.json`));
        } else {
            fs.renameSync(path.join(facePath, `${id}.face.json`), path.join(facePath, `${id}.old`));
        }
    }
}

/**
 * 
 * @param {string} targetID 
 * @param {number[]} compareEmbeddings 
 */
function findDistance(targetID, compareEmbeddings) {
    try {
        let embedding = identities.get(targetID);
        let highestDist = Number.MIN_SAFE_INTEGER;

        for (let emb of embedding) {
            let cosine_dist = _dist(emb, compareEmbeddings);
            if (cosine_dist > highestDist)
                highestDist = cosine_dist;
        }

        return highestDist;
    } catch (error) {
        console.log("findDistance ::", error);
        return -1;
    }
}

/**
 * 
 * @param {number[][]} embeddings 
 * @param {number} threshold 
 */
function inferFace(embeddings, threshold = 0.65) {

    let _testID = (id, embds, threshold = 0.65) => {
        let storedEmbeds = identities.get(id);
        let lowest = Number.MAX_SAFE_INTEGER;
        
        for (let a of storedEmbeds) {
            for (let b of embds) {
                let distance = _dist(a, b, threshold);
                if (distance < lowest) {
                    lowest = distance;
                }
            }
        }
    }

    for (let id in identities) {
        
    }
}

loadFaces();

module.exports = {
    loadFaces, addFace, removeIdentity, inferFace, findDistance
}