const glob = require("fast-glob");
const path = require("path");

/**
 * 
 * @param {import("express").Application} app 
 */
function applyRoute(app) {
    let routeFiles = glob.sync("**/*.route.js");

    for (let file of routeFiles) {
        let {path:routePath, route} = require(path.join(__dirname, "../", file));
        app.use(routePath, route);
    }
}

module.exports = {
    applyRoute
}