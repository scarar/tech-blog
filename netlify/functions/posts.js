const fs = require('fs').promises;
const path = require('path');
const { DateTime } = require('luxon');
const crypto = require('crypto');

const POSTS_DIR = path.join(process.cwd(), 'src', 'posts');

// Verify token (same as in auth.js)
function verifyToken(token) {
  if (!token) return false;
  
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
  try {
    // In a real-world scenario, you'd use a proper JWT library
    // This is a simplified version for demonstration
    const decodedToken = JSON.parse(
      crypto.createHmac('sha256', secret)
        .update(token)
        .digest('hex')
    );
    
    // Check token expiration
    return decodedToken.exp > Math.floor(Date.now() / 1000);
  } catch (error) {
    return false;
  }
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, DELETE, PUT, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Check authorization for methods that modify data
  const token = event.headers.authorization?.split(' ')[1];
  const isAuthorized = ['POST', 'DELETE', 'PUT'].includes(event.httpMethod) 
    ? verifyToken(token) 
    : true;

  if (!isAuthorized) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ message: 'Unauthorized' })
    };
  }

  try {
    if (event.httpMethod === 'POST') {
      // Parse the incoming post data
      const postData = JSON.parse(event.body);

      // Validate required fields
      if (!postData.title || !postData.content) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Title and content are required' })
        };
      }

      // Generate a unique filename based on title and date
      const slug = postData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const timestamp = DateTime.local().toFormat('yyyy-MM-dd-HHmmss');
      const filename = `${timestamp}-${slug}.md`;
      const filePath = path.join(POSTS_DIR, filename);

      // Create Markdown content with frontmatter
      const fileContent = `---
title: "${postData.title}"
date: ${postData.date || new Date().toISOString()}
tags: ${JSON.stringify(postData.tags || [])}
excerpt: "${postData.excerpt || ''}"
---

${postData.content}`;

      // Write the file
      await fs.writeFile(filePath, fileContent, 'utf8');

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          message: 'Post created successfully', 
          filename 
        })
      };
    } else if (event.httpMethod === 'GET') {
      // Read existing posts
      const files = await fs.readdir(POSTS_DIR);
      const posts = await Promise.all(
        files
          .filter(file => file.endsWith('.md'))
          .map(async (file) => {
            const filePath = path.join(POSTS_DIR, file);
            const content = await fs.readFile(filePath, 'utf8');
            
            // Parse frontmatter
            const match = content.match(/---\n([\s\S]*?)\n---\n([\s\S]*)/);
            const frontmatter = match[1];
            const body = match[2];

            const metadata = frontmatter.split('\n').reduce((acc, line) => {
              const [key, value] = line.split(': ');
              if (key && value) {
                acc[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
              }
              return acc;
            }, {});

            return {
              id: file,
              ...metadata,
              content: body.trim()
            };
          })
      );

      // Sort posts by date (most recent first)
      posts.sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(posts)
      };
    } else if (event.httpMethod === 'DELETE') {
      // Delete a specific post
      const { id } = JSON.parse(event.body);
      const filePath = path.join(POSTS_DIR, id);

      // Ensure the file exists in the posts directory
      if (!id.endsWith('.md') || !filePath.startsWith(POSTS_DIR)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Invalid post ID' })
        };
      }

      try {
        await fs.unlink(filePath);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Post deleted successfully' })
        };
      } catch (error) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Post not found' })
        };
      }
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Internal Server Error', 
        error: error.toString() 
      })
    };
  }
};
