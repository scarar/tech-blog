const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Utility function to normalize tags
function normalizeTags(tagsString) {
  if (!tagsString) return '';
  return tagsString
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag !== '')
    .join(',');
}

// Middleware to normalize tags for all post-related routes
function normalizePostTags(req, res, next) {
  if (req.body && req.body.tags) {
    req.body.tags = normalizeTags(req.body.tags);
  }
  next();
}

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blog_database'
};

// Test database connection
async function testDatabaseConnection() {
  let connection;
  try {
    console.log('Attempting to connect to database with config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database
    });
    
    connection = await mysql.createConnection(dbConfig);
    console.log('Database connection successful!');
    
    // List all tables in the database
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Tables in database:', tables.map(t => Object.values(t)[0]));
    
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    
    // If database doesn't exist, try to create it
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('Database does not exist. Attempting to create it...');
      try {
        // Create a connection without specifying a database
        const tempConnection = await mysql.createConnection({
          host: dbConfig.host,
          user: dbConfig.user,
          password: dbConfig.password
        });
        
        // Create the database
        await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        console.log(`Database '${dbConfig.database}' created successfully`);
        
        await tempConnection.end();
        return true;
      } catch (createError) {
        console.error('Failed to create database:', createError);
        return false;
      }
    }
    
    return false;
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
}

// Generate a secure token
function generateToken(username) {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
  return jwt.sign({ username }, secret, { expiresIn: '1h' });
}

// Verify token middleware
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      message: 'Invalid or expired token',
      error: error.toString()
    });
  }
}

// Authentication route
app.post('/auth', async (req, res) => {
  let connection;
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', username);

    // Create database connection
    connection = await mysql.createConnection(dbConfig);

    // Validate user credentials
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE username = ? AND password = ?', 
      [username, password]
    );

    if (rows.length > 0) {
      console.log('Login successful for:', username);
      const token = generateToken(username);
      
      res.json({ 
        message: 'Login successful', 
        token,
        user: {
          id: rows[0].id,
          username: rows[0].username,
          role: rows[0].role
        }
      });
    } else {
      console.log('Invalid credentials for:', username);
      res.status(401).json({ 
        message: 'Invalid credentials',
        details: 'Username or password incorrect'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      message: 'Internal Server Error', 
      error: error.toString(),
      details: {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database
      }
    });
  } finally {
    // Close the database connection
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
});

// Get public posts route (no authentication required)
app.get('/public-posts', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Get all published posts
    const [posts] = await connection.execute(
      `SELECT p.*, u.username as author 
       FROM posts p 
       JOIN users u ON p.author_id = u.id 
       WHERE p.status = 'published' 
       ORDER BY p.created_at DESC`
    );
    
    // Convert 'published' to 'public' for API consistency and normalize tags
    const formattedPosts = posts.map(post => ({
      ...post,
      status: 'public',
      tags: normalizeTags(post.tags),
      // Convert tag string to URL-friendly format for tag pages
      tagUrls: normalizeTags(post.tags)
        .split(',')
        .map(tag => tag.replace(/\s+/g, '-'))
    }));
    
    // Debug: Log the number of posts found
    console.log(`Found ${posts.length} public posts`);
    
    res.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching public posts:', error);
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
});

// Get a single public post by ID
app.get('/public-posts/:id', async (req, res) => {
  let connection;
  try {
    const postId = req.params.id;
    connection = await mysql.createConnection(dbConfig);
    
    console.log(`Attempting to fetch post with ID: ${postId}`);
    
    // Get the post with the specified ID that is published
    const [posts] = await connection.execute(
      'SELECT p.*, u.username as author FROM posts p JOIN users u ON p.author_id = u.id WHERE p.id = ?',
      [postId]
    );
    
    console.log(`Fetched posts: ${JSON.stringify(posts)}`);
    
    if (posts.length === 0) {
      console.log(`No post found with ID: ${postId}`);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Only return the post if it's published
    if (posts[0].status !== 'published') {
      console.log(`Post ${postId} is not published (current status: ${posts[0].status})`);
      return res.status(403).json({ message: 'Post is not published' });
    }
    
    // Convert 'published' status to 'public' for API consistency
    const post = {
      ...posts[0],
      status: 'public',
      tags: normalizeTags(posts[0].tags),
      // Convert tag string to URL-friendly format for tag pages
      tagUrls: normalizeTags(posts[0].tags)
        .split(',')
        .map(tag => tag.replace(/\s+/g, '-'))
    };
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Error fetching post', error: error.message });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
});

// Get all posts route (admin only)
app.get('/posts', verifyToken, async (req, res) => {
  let connection;
  try {
    // Get user from token
    const username = req.user.username;
    
    connection = await mysql.createConnection(dbConfig);
    
    // Check if user exists and is admin
    const [userRows] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get all posts (both draft and public)
    const [posts] = await connection.execute(
      `SELECT p.*, u.username as author 
       FROM posts p 
       JOIN users u ON p.author_id = u.id 
       ORDER BY p.created_at DESC`
    );
    
    // Convert 'published' to 'public' for API consistency
    const formattedPosts = posts.map(post => ({
      ...post,
      status: post.status === 'published' ? 'public' : post.status,
      // Normalize tags: trim, remove empty tags, convert to lowercase
      tags: normalizeTags(post.tags),
      // Convert tag string to URL-friendly format for tag pages
      tagUrls: normalizeTags(post.tags)
        .split(',')
        .map(tag => tag.replace(/\s+/g, '-'))
    }));
    
    res.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
});

// Get single post by ID (admin only)
app.get('/posts/:id', verifyToken, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await mysql.createConnection(dbConfig);
    
    const [posts] = await connection.execute(
      `SELECT p.*, u.username as author 
       FROM posts p 
       JOIN users u ON p.author_id = u.id 
       WHERE p.id = ?`,
      [id]
    );
    
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Convert 'published' to 'public' for API consistency
    const formattedPost = {
      ...posts[0],
      status: posts[0].status === 'published' ? 'public' : posts[0].status,
      tags: normalizeTags(posts[0].tags),
      // Convert tag string to URL-friendly format for tag pages
      tagUrls: normalizeTags(posts[0].tags)
        .split(',')
        .map(tag => tag.replace(/\s+/g, '-'))
    };
    
    res.json(formattedPost);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Error fetching post' });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
});

// Create post route
app.post('/posts', normalizePostTags, verifyToken, async (req, res) => {
  let connection;
  try {
    const { title, content, excerpt, tags, status } = req.body;
    console.log('Creating post:', title);
    
    // Default to draft if status not provided
    const postStatus = status === 'public' ? 'published' : status === 'draft' ? 'draft' : 'draft';
    
    connection = await mysql.createConnection(dbConfig);
    
    // Get user ID from token
    const username = req.user.username;
    const [userRows] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const authorId = userRows[0].id;
    
    // Insert post into database
    const [result] = await connection.execute(
      'INSERT INTO posts (title, content, excerpt, tags, author_id, status) VALUES (?, ?, ?, ?, ?, ?)',
      [title, content, excerpt || '', tags, authorId, postStatus]
    );
    
    res.status(201).json({ 
      message: 'Post created successfully',
      postId: result.insertId
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ 
      message: 'Error creating post',
      error: error.toString()
    });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
});

// Update post status route
app.put('/posts/:id/status', verifyToken, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`Updating post ${id} status to: ${status}`); // Debug
    
    // Check if status is valid
    if (!['draft', 'public'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    // Convert 'public' to 'published' for database compatibility
    const dbStatus = status === 'public' ? 'published' : status;
    
    connection = await mysql.createConnection(dbConfig);
    
    // Check if post exists
    const [posts] = await connection.execute(
      'SELECT * FROM posts WHERE id = ?',
      [id]
    );
    
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Update post status
    await connection.execute(
      'UPDATE posts SET status = ? WHERE id = ?',
      [dbStatus, id]
    );
    
    console.log(`Successfully updated post ${id} status to ${dbStatus}`); // Debug
    
    res.json({ message: 'Post status updated successfully' });
  } catch (error) {
    console.error('Error updating post status:', error);
    res.status(500).json({ message: 'Error updating post status' });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
});

// Delete post endpoint
app.delete('/posts/:id', verifyToken, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    console.log(`Attempting to delete post ${id}`);
    
    connection = await mysql.createConnection(dbConfig);
    
    // Check if post exists
    const [posts] = await connection.execute(
      'SELECT * FROM posts WHERE id = ?',
      [id]
    );
    
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Delete the post
    await connection.execute(
      'DELETE FROM posts WHERE id = ?',
      [id]
    );
    
    console.log(`Successfully deleted post ${id}`);
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting post' });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
});

// Update post endpoint
app.put('/posts/:id', normalizePostTags, verifyToken, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { title, content, excerpt, tags, status } = req.body;
    
    console.log(`Attempting to update post ${id}`);
    
    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    // Convert status for database compatibility
    const dbStatus = status === 'public' ? 'published' : 'draft';
    
    connection = await mysql.createConnection(dbConfig);
    
    // Check if post exists
    const [posts] = await connection.execute(
      'SELECT * FROM posts WHERE id = ?',
      [id]
    );
    
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Update the post
    await connection.execute(
      'UPDATE posts SET title = ?, content = ?, excerpt = ?, tags = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [title, content, excerpt, tags, dbStatus, id]
    );
    
    console.log(`Successfully updated post ${id}`);
    
    res.json({ 
      message: 'Post updated successfully',
      post: {
        id,
        title,
        content,
        excerpt,
        tags,
        status: status // Return the API-friendly status
      }
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Error updating post' });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
});

// Get all tags
app.get('/tags', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [posts] = await connection.execute(
      `SELECT tags FROM posts WHERE status = 'published'`
    );
    const tagSet = new Set();
    
    posts.forEach(post => {
      if (post.tags) {
        post.tags.split(',').forEach(tag => {
          tagSet.add(tag.trim().toLowerCase());
        });
      }
    });
    
    res.json(Array.from(tagSet));
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Error fetching tags' });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
});

// Serve static files from the _site directory
app.use(express.static('_site'));

// Redirect from old /tags/ format to new /tag/ format
app.get('/tags/:tag', (req, res) => {
  res.redirect(`/tag/${req.params.tag}/`);
});

// Fallback route for SPA navigation
app.get('*', (req, res) => {
  // Check if the request is for an API endpoint
  if (req.path.startsWith('/api/') || 
      req.path.startsWith('/login') || 
      req.path.startsWith('/posts') || 
      req.path.startsWith('/public-posts') ||
      req.path.startsWith('/tags')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  // For all other routes, serve the index.html file
  res.sendFile(path.join(__dirname, '_site', 'index.html'));
});

// Initialize database with test data if empty
async function initializeTestData() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Check if users table exists
    const [userTables] = await connection.execute(
      `SHOW TABLES LIKE 'users'`
    );
    
    if (userTables.length === 0) {
      console.log('Creating users table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Check if posts table exists
    const [postTables] = await connection.execute(
      `SHOW TABLES LIKE 'posts'`
    );
    
    if (postTables.length === 0) {
      console.log('Creating posts table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS posts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          excerpt TEXT,
          tags VARCHAR(255),
          status ENUM('draft', 'published') DEFAULT 'draft',
          author_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (author_id) REFERENCES users(id)
        )
      `);
    }
    
    // Check if admin user exists
    const [adminUsers] = await connection.execute(
      `SELECT * FROM users WHERE username = 'admin'`
    );
    
    if (adminUsers.length === 0) {
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.execute(
        `INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')`,
        ['admin', hashedPassword]
      );
    }
    
    // Check if there are any posts
    const [postCount] = await connection.execute(
      `SELECT COUNT(*) as count FROM posts`
    );
    
    if (postCount[0].count === 0) {
      console.log('Adding test posts...');
      
      // Get admin user ID
      const [adminUser] = await connection.execute(
        `SELECT id FROM users WHERE username = 'admin'`
      );
      
      const adminId = adminUser[0].id;
      
      // Add a published test post
      await connection.execute(
        `INSERT INTO posts (title, content, excerpt, tags, status, author_id) 
         VALUES (?, ?, ?, ?, 'published', ?)`,
        [
          'Welcome to My Tech Blog',
          '<p>This is a test post to demonstrate the blog functionality. This post is published and should be visible to all visitors.</p><p>Feel free to explore the features of this blog!</p>',
          'A welcome post to demonstrate the blog functionality',
          'welcome,test',
          adminId
        ]
      );
      
      // Add a draft test post
      await connection.execute(
        `INSERT INTO posts (title, content, excerpt, tags, status, author_id) 
         VALUES (?, ?, ?, ?, 'draft', ?)`,
        [
          'Draft Post Example',
          '<p>This is a draft post that should only be visible to admins.</p><p>You can publish this post when you\'re ready for it to be visible to all visitors.</p>',
          'An example of a draft post',
          'draft,test',
          adminId
        ]
      );
      
      console.log('Test data added successfully');
    }
    
  } catch (error) {
    console.error('Error initializing test data:', error);
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
}

// Call the initialization function when the server starts
initializeTestData();

// Call the test database connection function when the server starts
testDatabaseConnection();

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
