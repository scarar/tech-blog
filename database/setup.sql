-- Create database
CREATE DATABASE IF NOT EXISTS blog_database;

-- Use the database
USE blog_database;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role ENUM('admin', 'editor', 'viewer') DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id INT,
    tags VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Insert initial admin user (replace with a secure password hash in production)
INSERT IGNORE INTO users (username, password, email, role) VALUES 
('admin', 'blog2025!', 'admin@blog.com', 'admin');

-- Insert initial dummy posts
INSERT IGNORE INTO posts (title, content, excerpt, tags, author_id) VALUES 
(
    'Welcome to My New Blog: A Journey into Tech and Innovation', 
    '# Welcome to My New Blog: A Journey into Tech and Innovation\n\n## Introduction\n\nHello, world! 👋 Welcome to my personal blog, a digital space where technology meets creativity. Here, I\'ll be sharing insights, experiences, and thoughts on the ever-evolving world of tech and innovation.\n\n## What to Expect\n\n- In-depth tech analysis\n- Personal project showcases\n- Industry trends and predictions\n- Coding tutorials and tips\n\nStay tuned for an exciting journey!', 
    'A personal blog exploring the frontiers of technology and innovation.', 
    'technology,introduction,personal-blog', 
    1
),
(
    'The Future of AI: Transforming Industries', 
    '# The Future of AI: Transforming Industries\n\nArtificial Intelligence (AI) is no longer a futuristic concept but a present-day reality reshaping industries across the globe. From healthcare to finance, AI is driving unprecedented changes and creating new possibilities.\n\n## Key Areas of Impact\n\n1. **Healthcare**: Predictive diagnostics and personalized treatment\n2. **Finance**: Algorithmic trading and fraud detection\n3. **Manufacturing**: Predictive maintenance and process optimization\n\n## Ethical Considerations\n\nAs AI continues to advance, we must carefully consider its ethical implications and ensure responsible development.', 
    'Exploring how Artificial Intelligence is revolutionizing various industries.', 
    'ai,technology,future-trends', 
    1
);
