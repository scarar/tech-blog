// Generate a separate file for each post (1-100)
module.exports = function(eleventyConfig) {
  // Add config for Markdown rendering
  const markdownIt = require('markdown-it');
  const markdownItOptions = {
    html: true,
    breaks: true,
    linkify: true
  };
  
  // Set up markdown renderer with plugins
  const markdownLib = markdownIt(markdownItOptions);
  eleventyConfig.setLibrary("md", markdownLib);
  
  // Add custom date filter
  eleventyConfig.addFilter("formatDate", function(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });
  
  // Add custom filter to limit array
  eleventyConfig.addFilter("limit", function(array, limit) {
    return array.slice(0, limit);
  });
  
  // Filter to get posts by tag
  eleventyConfig.addFilter("byTag", function(posts, tag) {
    if (!tag) return posts;
    
    return posts.filter(post => {
      const tags = post.data.tags || [];
      return tags.includes(tag);
    });
  });
  
  // Generate post pages for each post ID
  for (let i = 1; i <= 100; i++) {
    eleventyConfig.addPassthroughCopy(`post/${i}`);
  }
  
  // Copy assets
  eleventyConfig.addPassthroughCopy('src/css');
  eleventyConfig.addPassthroughCopy('src/js');
  eleventyConfig.addPassthroughCopy('src/img');
  eleventyConfig.addPassthroughCopy('src/admin/config.yml');
  eleventyConfig.addPassthroughCopy('src/admin/index.html');
  eleventyConfig.addPassthroughCopy('src/posts/*.md');
  eleventyConfig.addPassthroughCopy('src/posts/*.json');
  
  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      layouts: '_layouts'
    },
    templateFormats: ['njk', 'md', 'html'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    passthroughFileCopy: true,
    pathPrefix: '/',
  };
};
