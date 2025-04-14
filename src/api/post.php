<?php
/**
 * Individual post API endpoint
 * Returns a single blog post by ID
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Include database configuration
include 'config.php';

// Get post ID from query parameter
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

// Validate and process request
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
