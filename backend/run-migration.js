const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'chatapp',
      multipleStatements: true // Allow multiple SQL statements
    });

    console.log('✅ Connected to MySQL database');
    console.log(`📊 Database: ${process.env.DB_NAME || 'chatapp'}`);

    // Read the migration SQL file
    const sqlFilePath = path.join(__dirname, '..', 'database', 'schema_update_google.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📝 Running migration: schema_update_google.sql');
    console.log('   Adding Google OAuth support to users table...\n');

    // Execute the migration
    await connection.query(sql);

    console.log('✅ Migration completed successfully!');
    console.log('\nAdded columns:');
    console.log('  - google_id (VARCHAR(255), UNIQUE, NULL)');
    console.log('  - profile_picture (VARCHAR(500), NULL)');
    console.log('\nUpdated columns:');
    console.log('  - password_hash (now nullable)');
    console.log('  - username (now nullable)');
    console.log('\n✅ Google OAuth database setup complete!');
    console.log('   You can now use Google login.');

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  Migration already applied - columns already exist');
      console.log('   This is okay, the database is already set up for Google OAuth.');
    } else if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
      console.log('⚠️  Some indexes may already exist, but migration should still work');
      console.log('   Error details:', error.message);
    } else {
      console.error('❌ Migration failed:', error.message);
      console.error('\nFull error:', error);
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the migration
runMigration();


