#!/bin/bash

# Replace these values with your information
REPO_NAME="tech-blog"
REPO_DESCRIPTION="A professional dark-themed tech blog with purple accents"
GITHUB_USERNAME="scarar"
# DO NOT hardcode your token in this file
# We'll prompt for it when running the script

echo "Enter your GitHub API token:"
read -s GITHUB_TOKEN

echo "Creating repository..."
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"$REPO_DESCRIPTION\",\"private\":false}"

# Add the remote origin
git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git

echo "Repository created! Now you can push your code with:"
echo "git push -u origin master"
