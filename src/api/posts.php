<?php
/**
 * Public posts API endpoint
 * Returns all published blog posts with optional tag filtering
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Include database configuration
include 'config.php';

// Get tag filter if present
$tag = isset($_GET['tag']) ? $_GET['tag'] : '';

// Build query
$sql = "SELECT * FROM posts WHERE status = 'published'";
if (!empty($tag)) {
    $sql .= " AND FIND_IN_SET('" . $conn->real_escape_string($tag) . "', REPLACE(tags, ',', ','))";
}
$sql .= " ORDER BY created_at DESC";

// Execute query
$result = $conn->query($sql);
$posts = [];

// Process results
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        // Convert 'published' status to 'public' for frontend
        if ($row['status'] === 'published') {
            $row['status'] = 'public';
        }
        $posts[] = $row;
    }
}

// Return JSON response
echo json_encode(['posts' => $posts]);
$conn->close();
?>
