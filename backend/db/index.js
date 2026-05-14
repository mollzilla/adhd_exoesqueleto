const { Pool, types } = require('pg');

// Return DATE columns as plain "YYYY-MM-DD" strings.
// Without this, pg converts DATE → JS Date → UTC midnight, which shifts the
// calendar day when serialised to JSON in a non-UTC timezone.
types.setTypeParser(1082, val => val);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = {
  query: (text, params) => pool.query(text, params),
};
