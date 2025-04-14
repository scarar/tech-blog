const API_BASE_URL = 'http://localhost:3000/api';

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', body = null) {
    console.log('API Call:', {
        endpoint,
        method,
        body: body ? JSON.stringify(body) : null
    });

    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };

    // Ensure dates are properly formatted
    if (body && body.date) {
        try {
            body.date = new Date(body.date).toISOString();
            console.log('Formatted Date:', body.date);
        } catch (error) {
            console.error('Date Formatting Error:', error);
            body.date = new Date().toISOString();
        }
    }

    const config = {
        method,
        headers,
        ...(body && { body: JSON.stringify(body) })
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'An error occurred');
    }

    const data = await response.json();
    console.log('API Response:', data);

    // Ensure dates are parsed correctly
    if (Array.isArray(data)) {
        return data.map(item => {
            if (item.date) {
                try {
                    item.date = new Date(item.date);
                    console.log('Parsed Date:', item.date);
                } catch (error) {
                    console.error('Date Parsing Error:', error);
                    item.date = null;
                }
            }
            return item;
        });
    } else if (data.date) {
        try {
            data.date = new Date(data.date);
        } catch (error) {
            console.error('Single Date Parsing Error:', error);
            data.date = null;
        }
    }

    return data;
}

// Authentication
export async function login(username, password) {
    return apiCall('/login', 'POST', { username, password });
}

// Post Management
export async function getPosts() {
    return apiCall('/posts');
}

export async function createPost(postData) {
    // Ensure date is always sent
    if (!postData.date) {
        postData.date = new Date().toISOString();
    }
    
    // Normalize tags to string
    if (postData.tags) {
        postData.tags = Array.isArray(postData.tags) 
            ? postData.tags.filter(tag => tag).join(',') 
            : String(postData.tags);
    } else {
        postData.tags = '';
    }

    return apiCall('/posts', 'POST', postData);
}

export async function updatePost(id, postData) {
    // Ensure date is always sent
    if (!postData.date) {
        postData.date = new Date().toISOString();
    }
    
    // Normalize tags to string
    if (postData.tags) {
        postData.tags = Array.isArray(postData.tags) 
            ? postData.tags.filter(tag => tag).join(',') 
            : String(postData.tags);
    } else {
        postData.tags = '';
    }

    return apiCall(`/posts/${id}`, 'PUT', postData);
}

export async function deletePost(id) {
    return apiCall(`/posts/${id}`, 'DELETE');
}
