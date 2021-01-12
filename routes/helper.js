/**
 * 
 * @param {import("express").Response} res 
 * @param {*} obj 
 */
function err(res, obj) {
    let response = {
        status: "error"
    };

    for (let key in obj) {
        response[key] = obj[key];
    }

    console.log(res.req.url + " ERROR:: ", obj);

    return res.json(response);
}

module.exports = {
    err
}