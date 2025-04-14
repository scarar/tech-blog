# Tech Blog with Dark Theme

## Overview

A modern, responsive blog built with Eleventy and Express.js. Features a professional dark theme with purple accents.

## Features

- Professional dark theme with purple accents
- Full-stack application with static frontend and API backend
- Tag-based filtering and post categorization
- Admin panel for content management
- Responsive layout for all device sizes
- Markdown support for blog posts

## Prerequisites

- Node.js (v14 or later) - *for development only*
- npm - *for development only* 
- MySQL database

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Set up your MySQL database using the schema provided

## Development

Start the frontend development server:
```bash
npm start
```

Start the backend API server:
```bash
npm run dev
```

## Build for Production

Create a production build:
```bash
npm run build
```

## Production Deployment

The project consists of two main components:
1. Static frontend files (HTML/CSS/JS) built by Eleventy
2. MySQL database for content storage

For production, we'll deploy the static files using Nginx or Apache2, without using Node.js in production.

### Database Setup

1. Create a MySQL database on your production server:
   ```sql
   CREATE DATABASE blog_db;
   ```

2. Import the database schema:
   ```bash
   mysql -u yourusername -p blog_db < database/setup.sql
   ```

3. Create a database user with appropriate permissions:
   ```sql
   CREATE USER 'blog_user'@'localhost' IDENTIFIED BY 'strong_password';
   GRANT SELECT, INSERT, UPDATE, DELETE ON blog_db.* TO 'blog_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Deploying with Nginx

1. Install Nginx:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install nginx
   
   # CentOS/RHEL
   sudo yum install epel-release
   sudo yum install nginx
   ```

2. Create an Nginx server block configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/tech-blog.conf
   ```

3. Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       root /var/www/tech-blog/_site;
       index index.html;
       
       # Enable gzip compression
       gzip on;
       gzip_types text/plain text/css application/javascript application/json;
       
       # Serve static files
       location / {
           try_files $uri $uri/ =404;
           expires 7d;
       }
       
       # Redirect 404 to homepage for tag-filtering support
       error_page 404 = /index.html;
       
       # Set up SSL (if using)
       # listen 443 ssl;
       # ssl_certificate /path/to/cert.pem;
       # ssl_certificate_key /path/to/key.pem;
   }
   ```

4. Enable the configuration and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/tech-blog.conf /etc/nginx/sites-enabled/
   sudo nginx -t  # Test configuration
   sudo systemctl restart nginx
   ```

5. Deploy your static files:
   ```bash
   # Copy files (run from your local machine)
   rsync -avz --delete _site/ user@yourdomain.com:/var/www/tech-blog/_site/
   ```

### Deploying with Apache2

1. Install Apache2:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install apache2
   
   # CentOS/RHEL
   sudo yum install httpd
   ```

2. Enable required modules:
   ```bash
   sudo a2enmod rewrite
   sudo a2enmod expires
   sudo a2enmod deflate
   ```

3. Create an Apache VirtualHost:
   ```bash
   sudo nano /etc/apache2/sites-available/tech-blog.conf
   ```

4. Add the following configuration:
   ```apache
   <VirtualHost *:80>
       ServerName yourdomain.com
       ServerAlias www.yourdomain.com
       DocumentRoot /var/www/tech-blog/_site
       
       <Directory /var/www/tech-blog/_site>
           Options -Indexes +FollowSymLinks
           AllowOverride All
           Require all granted
           
           # Enable Gzip compression
           <IfModule mod_deflate.c>
               AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json
           </IfModule>
           
           # Enable caching
           <IfModule mod_expires.c>
               ExpiresActive On
               ExpiresByType text/css "access plus 1 week"
               ExpiresByType application/javascript "access plus 1 week"
               ExpiresByType image/gif "access plus 1 month"
               ExpiresByType image/jpeg "access plus 1 month"
               ExpiresByType image/png "access plus 1 month"
           </IfModule>
           
           # Handle tag filtering by redirecting 404s to index
           ErrorDocument 404 /index.html
       </Directory>
   </VirtualHost>
   ```

5. Enable the site and restart Apache:
   ```bash
   sudo a2ensite tech-blog.conf
   sudo systemctl restart apache2
   ```

6. Deploy your static files:
   ```bash
   # Copy files (run from your local machine)
   rsync -avz --delete _site/ user@yourdomain.com:/var/www/tech-blog/_site/
   ```

### Frontend-Backend Communication

Since we're not using Node.js in production, ensure your frontend JavaScript makes proper AJAX requests to your MySQL database using a lightweight server-side script:

1. Create a PHP API endpoint (example):
   ```bash
   mkdir -p /var/www/tech-blog/api
   ```

2. Create a posts.php file:
   ```php
   <?php
   header('Content-Type: application/json');
   header('Access-Control-Allow-Origin: *');
   
   // Database connection
   $db = new mysqli('localhost', 'blog_user', 'strong_password', 'blog_db');
   
   if ($db->connect_error) {
       die('{"error": "Database connection failed"}');
   }
   
   // Get published posts
   $result = $db->query("SELECT * FROM posts WHERE status = 'published' ORDER BY created_at DESC");
   
   $posts = [];
   while ($row = $result->fetch_assoc()) {
       // Convert 'published' status to 'public' for frontend
       if ($row['status'] === 'published') {
           $row['status'] = 'public';
       }
       
       $posts[] = $row;
   }
   
   echo json_encode(['posts' => $posts]);
   ?>
   ```

3. Update the Nginx/Apache config to handle API requests:
   ```
   # For Nginx - Add to server block
   location /api/ {
       try_files $uri $uri/ /api/index.php?$args;
   }
   
   # For Apache - Add to .htaccess in the api directory
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ index.php?path=$1 [NC,L,QSA]
   ```

### Maintaining Theme and Features

This configuration preserves:
- The dark theme with purple accents (#8e65f0)
- Status conversion between 'published' (database) and 'public' (frontend)
- Tag filtering functionality

## Color Scheme

This blog uses a custom dark theme with the following colors:
- Background: #16213e (deep navy blue)
- Text: #e6e6e6 (light gray)
- Accent: #8e65f0 (purple)
- Secondary text: #a0a0a0 (medium gray)

## Database Configuration

The blog uses a MySQL database with status conversion between frontend and backend:
- Status in database: 'draft' and 'published'
- Status in frontend/API: 'draft' and 'public'

## License

MIT License