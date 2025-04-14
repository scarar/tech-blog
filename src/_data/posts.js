// Create data for post pages (1-100)
module.exports = function() {
  const posts = [];
  // Generate enough entries to create pages for posts 1-100
  for (let i = 1; i <= 100; i++) {
    posts.push({
      id: i
    });
  }
  return posts;
};
