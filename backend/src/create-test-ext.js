const { Client } = require('pg');

async function createExt() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/delivery_tracker_test"
  });

  try {
    await client.connect();
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log("PostGIS extension created successfully!");
  } catch (err) {
    console.error("Error creating extension:", err);
  } finally {
    await client.end();
  }
}

createExt();
