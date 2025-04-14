module.exports = {
  eleventyComputed: {
    tags: (data) => {
      // Ensure tags are always an array
      return data.tags || [];
    }
  },
  layout: 'base.njk'
};
