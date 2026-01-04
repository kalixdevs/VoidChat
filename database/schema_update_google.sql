-- Migration script to add Google OAuth support
-- Run this after the initial schema.sql

-- Add google_id column to users table
ALTER TABLE users 
ADD COLUMN google_id VARCHAR(255) UNIQUE NULL,
ADD COLUMN profile_picture VARCHAR(500) NULL,
ADD INDEX idx_google_id (google_id);

-- Make password_hash nullable for Google OAuth users
ALTER TABLE users 
MODIFY COLUMN password_hash VARCHAR(255) NULL;

-- Make username nullable (we'll use email or Google name)
ALTER TABLE users 
MODIFY COLUMN username VARCHAR(50) NULL;

-- Update unique constraint to allow NULL usernames
-- Note: For MariaDB compatibility, we'll remove the unique constraint on username
-- and handle uniqueness in application code if needed
ALTER TABLE users 
DROP INDEX IF EXISTS idx_username;

-- Create a regular index (not unique) for username to allow NULLs
CREATE INDEX idx_username ON users(username);

