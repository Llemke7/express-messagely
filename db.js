const { Client } = require("pg");
const { DB_URI } = require("./config");


const client = new Client({
  connectionString: DB_URI,
});


client.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch(err => console.error("Error connecting to PostgreSQL:", err.stack));


module.exports = client;
