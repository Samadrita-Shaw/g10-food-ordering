# Bruno Import Troubleshooting Guide

## Fixed Issues
✅ Updated all `bruno.json` files with proper Bruno collection format
✅ Added required `ignore` field
✅ Fixed environment variable structure

## Import Steps (Try These in Order)

### Method 1: Import Individual Service Folders
1. Open Bruno Desktop App
2. Click "Open Collection" (not "Import")
3. Navigate to: `testing/bruno-collections-by-service/`
4. Select a service folder (e.g., `user-service`)
5. Bruno should recognize the `bruno.json` file automatically

### Method 2: Create New Collection & Copy Files
1. In Bruno, create a new collection
2. Manually copy the `.bru` files into the new collection folder
3. Update the `bruno.json` with the fixed format

### Method 3: Alternative Bruno CLI Install
```bash
# Install Bruno CLI via npm
npm install -g @usebruno/cli

# Or via Homebrew (macOS)
brew install bruno
```

## If Import Still Fails

### Check Bruno Version
- Ensure you're using Bruno v1.0+ 
- Download latest from: https://www.usebruno.com/downloads

### Manual Import Process
1. Create empty collection in Bruno
2. Copy contents of each `.bru` file manually
3. Set up environments manually using the variables from `bruno.json`

### Validate File Structure
Each service folder should have:
- ✅ `bruno.json` (collection config)
- ✅ Multiple `.bru` files (requests)
- ✅ Proper file permissions

## Test Import Success
After successful import:
1. Check if all 5 service collections appear
2. Verify environment variables are loaded
3. Try running a health check request

## Quick Test Commands
```bash
# Verify file structure
ls -la testing/bruno-collections-by-service/*/

# Check JSON syntax
cat testing/bruno-collections-by-service/user-service/bruno.json | python -m json.tool
```