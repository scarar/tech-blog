<?php
/**
 * Database configuration for the Tech Blog
 * This file contains database connection settings
 */

// Database connection parameters
$db_host = 'localhost';
$db_user = 'admin';  // Default user from setup.sql
$db_pass = 'blog2025!';  // Default password from setup.sql
$db_name = 'blog_database';

// Create database connection
$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

// Check connection
if ($conn->connect_error) {
    die('{"error": "Database connection failed: ' . $conn->connect_error . '"}');
}

// Set character set
$conn->set_charset("utf8mb4");
?>
