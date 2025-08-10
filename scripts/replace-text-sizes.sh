#!/bin/bash

echo "Starting text size replacement..."

# Counter variables
TOTAL_FILES=0
MODIFIED_FILES=0

# Find all TSX/JSX files excluding archives and test files
FILES=$(find src/components src/features -type f \( -name "*.tsx" -o -name "*.jsx" \) | \
    grep -v "__archive__" | \
    grep -v "_archive" | \
    grep -v ".stories." | \
    grep -v ".test." | \
    grep -v ".spec.")

# Process each file
for FILE in $FILES; do
    TOTAL_FILES=$((TOTAL_FILES + 1))
    
    # Check if file contains any text size classes
    if grep -q "text-\(xs\|sm\|base\|lg\|xl\|2xl\|3xl\)" "$FILE"; then
        echo "Processing: $FILE"
        
        # Create backup
        cp "$FILE" "$FILE.bak"
        
        # Perform replacements
        sed -i \
            -e 's/\btext-3xl\b/asana-text-2xl/g' \
            -e 's/\btext-2xl\b/asana-text-2xl/g' \
            -e 's/\btext-xl\b/asana-text-xl/g' \
            -e 's/\btext-lg\b/asana-text-lg/g' \
            -e 's/\btext-base\b/asana-text-base/g' \
            -e 's/\btext-sm\b/asana-text-sm/g' \
            -e 's/\btext-xs\b/text-[11px]/g' \
            "$FILE"
        
        # Check if file was actually modified
        if ! diff -q "$FILE" "$FILE.bak" > /dev/null; then
            MODIFIED_FILES=$((MODIFIED_FILES + 1))
            echo "  ✓ Modified"
            rm "$FILE.bak"
        else
            echo "  - No changes"
            rm "$FILE.bak"
        fi
    fi
done

echo ""
echo "============================================================"
echo "REPLACEMENT SUMMARY"
echo "============================================================"
echo "Total files scanned: $TOTAL_FILES"
echo "Files modified: $MODIFIED_FILES"
echo ""
echo "✅ Text size replacement complete!"