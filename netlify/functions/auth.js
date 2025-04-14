const mysql = require('mysql2/promise');
const crypto = require('crypto');

// Logging function
function log(message, data = {}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    message,
    ...data
  }));
}

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blog_database',
  connectTimeout: 10000, // 10 seconds
  acquireTimeout: 10000  // 10 seconds
};

// Generate a secure token
function generateToken(username) {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
  const payload = {
    username,
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
  };
  
  return crypto.createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

// Verify token
function verifyToken(token) {
  if (!token) return false;
  
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_for_development';
  try {
    const decodedToken = JSON.parse(
      crypto.createHmac('sha256', secret)
        .update(token)
        .digest('hex')
    );
    
    // Check token expiration
    return decodedToken.exp > Math.floor(Date.now() / 1000);
  } catch (error) {
    log('Token verification error', { error: error.toString() });
    return false;
  }
}

exports.handler = async (event, context) => {
  // Log incoming request details
  log('Incoming request', {
    method: event.httpMethod,
    path: event.path,
    headers: event.headers,
    body: event.body
  });

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  let connection;
  try {
    // Log database configuration
    log('Database connection attempt', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database
    });

    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    log('Database connection established');

    if (event.httpMethod === 'POST') {
      // Parse request body safely
      let username, password;
      try {
        const body = JSON.parse(event.body || '{}');
        username = body.username;
        password = body.password;
      } catch (parseError) {
        log('Body parsing error', { error: parseError.toString(), body: event.body });
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            message: 'Invalid request body',
            error: parseError.toString()
          })
        };
      }

      log('Login attempt', { username });

      // Validate user credentials
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE username = ? AND password = ?', 
        [username, password]
      );

      if (rows.length > 0) {
        log('Login successful', { username });
        const token = generateToken(username);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            message: 'Login successful', 
            token,
            user: {
              id: rows[0].id,
              username: rows[0].username,
              role: rows[0].role
            }
          })
        };
      }

      // Invalid credentials
      log('Invalid credentials', { username });
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          message: 'Invalid credentials',
          details: 'Username or password incorrect',
          providedUsername: username
        })
      };
    }

    // Verify token endpoint
    if (event.httpMethod === 'GET') {
      const token = event.headers.authorization?.split(' ')[1];
      
      return {
        statusCode: verifyToken(token) ? 200 : 401,
        headers,
        body: JSON.stringify({ 
          valid: verifyToken(token),
          message: verifyToken(token) ? 'Token is valid' : 'Token is invalid' 
        })
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  } catch (error) {
    log('Authentication error', { 
      error: error.toString(),
      stack: error.stack,
      dbConfig: {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database
      }
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Internal Server Error', 
        error: error.toString(),
        details: {
          host: dbConfig.host,
          user: dbConfig.user,
          database: dbConfig.database
        }
      })
    };
  } finally {
    // Close the database connection
    if (connection) {
      try {
        await connection.end();
        log('Database connection closed');
      } catch (closeError) {
        log('Error closing database connection', { error: closeError.toString() });
      }
    }
  }
};
