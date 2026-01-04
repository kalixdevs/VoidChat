const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkMigration() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'chatapp'
    });

    console.log('Checking database schema...\n');

    // Check if google_id column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
      AND COLUMN_NAME IN ('google_id', 'profile_picture')
    `, [process.env.DB_NAME || 'chatapp']);

    console.log('Google OAuth columns:');
    if (columns.length === 0) {
      console.log('  ❌ google_id column: NOT FOUND');
      console.log('  ❌ profile_picture column: NOT FOUND');
      console.log('\n⚠️  You need to run the migration!');
      console.log('   Run: npm run migrate');
    } else {
      columns.forEach(col => {
        console.log(`  ✅ ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
      });
    }

    // Check password_hash and username nullability
    const [allColumns] = await connection.query(`
      SELECT COLUMN_NAME, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
      AND COLUMN_NAME IN ('password_hash', 'username')
    `, [process.env.DB_NAME || 'chatapp']);

    console.log('\nOther columns:');
    allColumns.forEach(col => {
      const nullable = col.IS_NULLABLE === 'YES' ? '✅ nullable' : '❌ not nullable';
      console.log(`  ${col.COLUMN_NAME}: ${nullable}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkMigration();


