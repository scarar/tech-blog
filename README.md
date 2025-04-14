# Tech Blog with Dark Theme

## Overview

A modern, responsive blog with a professional dark theme and purple accents. This blog can be deployed without Node.js in production.

## Features

- Professional dark theme with purple accents (#8e65f0)
- Tag-based filtering and post categorization
- Admin panel for content management
- Responsive layout for all device sizes
- Markdown support for blog posts

## Development Setup (Only needed for blog customization)

For development and customization, you'll need:
- Node.js (v14 or later)
- npm

```bash
# Clone the repository
git clone https://github.com/scarar/tech-blog.git
cd tech-blog

# Install dependencies
npm install

# Run development server
npm start
```

## Production Deployment (No Node.js Required)

### Step 1: Build the Static Files (One-time step)

If you want to deploy the pre-built version directly, skip to Step 2.

```bash
# Build the static site
npm run build
```

This creates a `_site` folder containing all the static HTML, CSS, and JavaScript files.

### Step 2: Set Up Your Web Server

#### Option A: Nginx Setup (Recommended)

1. **Install Nginx**
   ```bash
   # Debian/Ubuntu
   sudo apt update && sudo apt install nginx

   # CentOS/RHEL
   sudo yum install epel-release && sudo yum install nginx
   ```

2. **Create a configuration file**
   ```bash
   sudo nano /etc/nginx/sites-available/tech-blog
   ```

3. **Add this configuration**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       root /var/www/tech-blog/_site;
       index index.html;
       
       # Performance settings
       gzip on;
       gzip_types text/css application/javascript image/svg+xml;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # For tag filtering support
       error_page 404 = /index.html;
   }
   ```

4. **Enable and start**
   ```bash
   sudo ln -s /etc/nginx/sites-available/tech-blog /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

#### Option B: Apache Setup

1. **Install Apache**
   ```bash
   # Debian/Ubuntu
   sudo apt update && sudo apt install apache2

   # CentOS/RHEL
   sudo yum install httpd
   ```

2. **Create a VirtualHost**
   ```bash
   sudo nano /etc/apache2/sites-available/tech-blog.conf
   ```

3. **Add this configuration**
   ```apache
   <VirtualHost *:80>
       ServerName yourdomain.com
       DocumentRoot /var/www/tech-blog/_site
       
       <Directory /var/www/tech-blog/_site>
           Options -Indexes +FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
       
       # For tag filtering support
       ErrorDocument 404 /index.html
   </VirtualHost>
   ```

4. **Enable modules and site**
   ```bash
   sudo a2enmod rewrite
   sudo a2ensite tech-blog.conf
   sudo systemctl restart apache2
   ```

### Step 3: Upload Blog Files

```bash
# Create directory
sudo mkdir -p /var/www/tech-blog

# Copy files (from your local machine where you cloned the repo)
sudo cp -r _site/* /var/www/tech-blog/_site/
```

### Step 4: Set Up Database

1. **Install MySQL**
   ```bash
   # Debian/Ubuntu
   sudo apt update && sudo apt install mysql-server

   # CentOS/RHEL
   sudo yum install mysql-server
   sudo systemctl start mysqld
   ```

2. **Import the database schema**
   ```bash
   mysql -u root -p < database/setup.sql
   ```

3. **Create a database user**
   ```bash
   mysql -u root -p
   ```

   Then in the MySQL prompt:
   ```sql
   CREATE USER 'blog_user'@'localhost' IDENTIFIED BY 'choose_strong_password';
   GRANT ALL PRIVILEGES ON blog_database.* TO 'blog_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

### Step 5: Create Simple Backend API (PHP)

1. **Install PHP and extensions**
   ```bash
   # Debian/Ubuntu
   sudo apt install php php-mysql php-json

   # CentOS/RHEL
   sudo yum install php php-mysqlnd php-json
   ```

2. **Create API directory**
   ```bash
   sudo mkdir -p /var/www/tech-blog/api
   ```

3. **Create PHP files for the API endpoints**

   **Create config.php**
   ```bash
   sudo nano /var/www/tech-blog/api/config.php
   ```
   
   Add:
   ```php
   <?php
   $db_host = 'localhost';
   $db_user = 'blog_user';
   $db_pass = 'choose_strong_password'; // Use the password you set earlier
   $db_name = 'blog_database';
   
   $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
   if ($conn->connect_error) {
       die('{"error": "Connection failed: ' . $conn->connect_error . '"}');
   }
   ?>
   ```

   **Create posts.php**
   ```bash
   sudo nano /var/www/tech-blog/api/posts.php
   ```
   
   Add:
   ```php
   <?php
   header('Content-Type: application/json');
   header('Access-Control-Allow-Origin: *');
   
   include 'config.php';
   
   // Get tag filter if present
   $tag = isset($_GET['tag']) ? $_GET['tag'] : '';
   
   // Build query
   $sql = "SELECT * FROM posts WHERE status = 'published'";
   if (!empty($tag)) {
       $sql .= " AND FIND_IN_SET('" . $conn->real_escape_string($tag) . "', REPLACE(tags, ',', ','))";
   }
   $sql .= " ORDER BY created_at DESC";
   
   $result = $conn->query($sql);
   $posts = [];
   
   if ($result->num_rows > 0) {
       while($row = $result->fetch_assoc()) {
           // Convert 'published' status to 'public' for frontend
           if ($row['status'] === 'published') {
               $row['status'] = 'public';
           }
           $posts[] = $row;
       }
   }
   
   echo json_encode(['posts' => $posts]);
   $conn->close();
   ?>
   ```

   **Create post.php for individual posts**
   ```bash
   sudo nano /var/www/tech-blog/api/post.php
   ```
   
   Add:
   ```php
   <?php
   header('Content-Type: application/json');
   header('Access-Control-Allow-Origin: *');
   
   include 'config.php';
   
   $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
   
   if ($id > 0) {
       $sql = "SELECT * FROM posts WHERE id = " . $id;
       $result = $conn->query($sql);
       
       if ($result->num_rows > 0) {
           $post = $result->fetch_assoc();
           
           // Convert 'published' status to 'public' for frontend
           if ($post['status'] === 'published') {
               $post['status'] = 'public';
           }
           
           echo json_encode(['post' => $post]);
       } else {
           echo json_encode(['error' => 'Post not found']);
       }
   } else {
       echo json_encode(['error' => 'Invalid post ID']);
   }
   
   $conn->close();
   ?>
   ```

4. **Update the web server configuration to handle API requests**

   **For Nginx, add inside the server block:**
   ```nginx
   location /api/ {
       try_files $uri $uri/ /api/index.php?$args;
   }
   ```

   **For Apache, create a .htaccess file:**
   ```bash
   sudo nano /var/www/tech-blog/api/.htaccess
   ```
   
   Add:
   ```
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ index.php?path=$1 [QSA,NC,L]
   ```

### Step 6: Update Frontend API URLs

1. Open the site JavaScript files in the `_site/js` directory
2. Update any API endpoint URLs to point to your new PHP backend:
   ```bash
   sudo find /var/www/tech-blog/_site -type f -name "*.js" -exec sed -i 's|http://localhost:3000/|/api/|g' {} \;
   ```

## Admin Interface

Access the admin interface at `yourdomain.com/admin`. Default credentials:
- Username: admin
- Password: blog2025!

**Change the default password immediately in production!**

## Color Scheme

This blog uses a custom dark theme with the following colors:
- Background: #16213e (deep navy blue)
- Text: #e6e6e6 (light gray)
- Accent: #8e65f0 (purple)
- Secondary text: #a0a0a0 (medium gray)

## Status Conversion

The blog maintains a consistent status mapping between database and frontend:
- Database status: 'draft' and 'published'
- Frontend/API status: 'draft' and 'public'

## License

MIT License