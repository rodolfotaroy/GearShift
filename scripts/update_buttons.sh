#!/bin/bash

# Find all .tsx files in src directory
find src -name "*.tsx" | while read -r file; do
    # Replace specific button class patterns
    sed -i 's/className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"/variant="primary"/g' "$file"
    sed -i 's/className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"/variant="default"/g' "$file"
    sed -i 's/className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"/variant="primary"/g' "$file"
    sed -i 's/className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"/variant="default"/g' "$file"
done
