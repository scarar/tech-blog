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
   sudo apt update && sudo apt install nginx php php-mysql php-json

   # CentOS/RHEL
   sudo yum install epel-release nginx php php-mysqlnd php-json
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
       root /var/www/tech-blog;
       index index.html;
       
       # Performance settings
       gzip on;
       gzip_types text/css application/javascript image/svg+xml;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # For tag filtering support
       error_page 404 = /index.html;
       
       # Handle API requests
       location /api/ {
           try_files $uri $uri/ /api/$uri;
       }
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
   sudo apt update && sudo apt install apache2 php php-mysql php-json

   # CentOS/RHEL
   sudo yum install httpd php php-mysqlnd php-json
   ```

2. **Create a VirtualHost**
   ```bash
   sudo nano /etc/apache2/sites-available/tech-blog.conf
   ```

3. **Add this configuration**
   ```apache
   <VirtualHost *:80>
       ServerName yourdomain.com
       DocumentRoot /var/www/tech-blog
       
       <Directory /var/www/tech-blog>
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

### Step 3: Deploy Your Blog

1. **Create directory and upload files**
   ```bash
   # Create directory
   sudo mkdir -p /var/www/tech-blog
   
   # Copy files (from your local machine where you cloned the repo)
   sudo cp -r _site/* /var/www/tech-blog/
   ```

2. **Set Up Database**
   ```bash
   # Install MySQL
   sudo apt install mysql-server  # Debian/Ubuntu
   # or
   sudo yum install mysql-server  # CentOS/RHEL
   sudo systemctl start mysqld
   
   # Import the database schema (creates database, tables, users and sample content)
   mysql -u root -p < database/setup.sql
   ```

3. **Set Proper Permissions**
   
   The repository includes a permissions script that handles all the setup for you, including copying the PHP API files to the correct location:
   
   ```bash
   # Make the script executable
   chmod +x tools/permissions.py
   
   # Run the script (specify your web server user/group if different)
   sudo tools/permissions.py --dir /var/www/tech-blog --user www-data --group www-data
   ```
   
   This script:
   - Creates the API directory
   - Copies all PHP files from src/api to the production directory
   - Sets the correct ownership and permissions
   - Makes config files secure

4. **Update Frontend API URLs** (if needed)
   ```bash
   # This command updates all JavaScript files to use the correct API endpoint
   sudo find /var/www/tech-blog -type f -name "*.js" -exec sed -i 's|http://localhost:3000/|/api/|g' {} \;
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