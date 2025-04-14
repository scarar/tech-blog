# Blog Post Creation Guide

## How to Create a New Blog Post

1. Create a new Markdown file in the `/src/posts/` directory
2. Use the following front matter template:

```markdown
---
title: Your Blog Post Title
date: YYYY-MM-DD
tags: ['tag1', 'tag2']
layout: base.njk
---

# Your Blog Post Title

## Introduction

Write your blog post content here using Markdown formatting.

### Sections

You can create sections, add:
- Lists
- Code blocks
- Links
- Images

## Conclusion

Wrap up your thoughts and provide key takeaways.
```

## Front Matter Explanation
- `title`: The title of your blog post
- `date`: Publication date (YYYY-MM-DD format)
- `tags`: Categories or topics for your post
- `layout`: Use 'base.njk' for the standard blog layout

## Markdown Tips
- Use '#' for headings (# = H1, ## = H2, etc.)
- Use '-' or '*' for bullet points
- Use backticks (`) for inline code
- Use triple backticks for code blocks

## Example Post Structure

```markdown
---
title: My First Technical Blog Post
date: 2025-04-13
tags: ['technology', 'programming']
layout: base.njk
---

# Exploring New Technologies

This is my first blog post about...
```
