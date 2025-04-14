#!/usr/bin/env python3
"""
Set proper permissions for the blog production directories.
Run this script as the root user after deployment.
"""

import os
import sys
import subprocess
import argparse

def run_command(command):
    """Run a shell command and print the output."""
    print(f"Running: {command}")
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    print(f"Success: {result.stdout}")
    return True

def set_permissions(base_dir, web_user, web_group):
    """Set the correct permissions for the blog directories."""
    if not os.path.isdir(base_dir):
        print(f"Error: {base_dir} is not a directory")
        return False
    
    # Create api directory if it doesn't exist
    api_dir = os.path.join(base_dir, "api")
    if not os.path.isdir(api_dir):
        os.makedirs(api_dir, exist_ok=True)
        print(f"Created API directory: {api_dir}")
    
    # Copy PHP files from src/api to the api directory
    php_source = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "api")
    if os.path.isdir(php_source):
        run_command(f"cp -r {php_source}/* {api_dir}/")
        print(f"Copied PHP files from {php_source} to {api_dir}")
    
    # Set ownership
    run_command(f"chown -R {web_user}:{web_group} {base_dir}")
    
    # Set directory permissions
    run_command(f"find {base_dir} -type d -exec chmod 755 {{}} \\;")
    
    # Set file permissions
    run_command(f"find {base_dir} -type f -exec chmod 644 {{}} \\;")
    
    # Make scripts executable
    run_command(f"find {base_dir} -name '*.py' -exec chmod 755 {{}} \\;")
    run_command(f"find {base_dir} -name '*.sh' -exec chmod 755 {{}} \\;")
    
    # Set specific permissions for sensitive files
    config_file = os.path.join(api_dir, "config.php")
    if os.path.isfile(config_file):
        run_command(f"chmod 640 {config_file}")
    
    print(f"\nPermissions set for {base_dir}")
    print(f"Web directory owner: {web_user}:{web_group}")
    print("Directory permissions: 755")
    print("File permissions: 644")
    print("Script permissions: 755")
    print("Config file permissions: 640")
    
    return True

def main():
    parser = argparse.ArgumentParser(description="Set proper permissions for the blog production directories")
    parser.add_argument("--dir", default="/var/www/tech-blog", help="Base directory of the blog (default: /var/www/tech-blog)")
    parser.add_argument("--user", default="www-data", help="Web server user (default: www-data)")
    parser.add_argument("--group", default="www-data", help="Web server group (default: www-data)")
    
    args = parser.parse_args()
    
    # Check if running as root
    if os.geteuid() != 0:
        print("This script must be run as root")
        sys.exit(1)
    
    if set_permissions(args.dir, args.user, args.group):
        print("All permissions set successfully!")
    else:
        print("Failed to set some permissions")
        sys.exit(1)

if __name__ == "__main__":
    main()
