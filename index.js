const express = require("express");
const cors = require("cors");

const router = require("./routes");
const jwtKeys = require("./jwt.keys");

const PORT = 9997;
const app = express();

app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:5000"]
}))

jwtKeys.preloadAllKeys();

app.use(express.json());

router.applyRoute(app);

app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
})