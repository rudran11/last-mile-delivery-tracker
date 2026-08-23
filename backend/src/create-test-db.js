const { Client } = require('pg');

async function createDb() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/postgres"
  });

  try {
    await client.connect();
    await client.query('CREATE DATABASE delivery_tracker_test');
    console.log("Database created successfully!");
  } catch (err) {
    console.error("Error creating database:", err);
  } finally {
    await client.end();
  }
}

createDb();
