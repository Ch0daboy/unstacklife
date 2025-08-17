#!/bin/bash

# Script to remove all Zone.Identifier files recursively
# These files are created by Windows when downloading files from the internet

echo "Searching for Zone.Identifier files..."

# Find and count Zone.Identifier files
count=$(find . -name "*:Zone.Identifier" -type f | wc -l)

if [ $count -eq 0 ]; then
    echo "No Zone.Identifier files found."
    exit 0
fi

echo "Found $count Zone.Identifier files:"
find . -name "*:Zone.Identifier" -type f

echo ""
read -p "Do you want to delete all these files? (y/N): " confirm

if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
    echo "Deleting Zone.Identifier files..."
    find . -name "*:Zone.Identifier" -type f -delete
    echo "Done! Deleted $count files."
else
    echo "Operation cancelled."
fi