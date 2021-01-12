const glob = require("fast-glob");
const path = require("path");
const config = require('../config');
const fs = require("fs");
/**
 * 
 * @param {import("express").Application} app 
 */
function applyRoute(app) {

    
    let routeFiles = glob.sync("**/*.route.js");

    for (let file of routeFiles) {
        file = path.join(config.Root, file);
        console.log(file);
        let {path:routePath, route} = require(file);
        app.use(routePath, route);
    }
}

module.exports = {
    applyRoute
}