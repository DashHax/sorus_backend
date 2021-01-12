const express = require("express");
const cors = require("cors");

const router = require("./routes");
const jwtKeys = require("./jwt.keys");
const config = require("./config");

const PORT = 9997;
const app = express();

app.use(cors({
    origin: config.CORS.allowedOrigin
}))

jwtKeys.preloadAllKeys();

app.use(express.json());

router.applyRoute(app);

app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
})