require("dotenv").config();
const app = require("./app");

// Terminal listen notification
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));