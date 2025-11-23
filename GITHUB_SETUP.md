# GitHub Repository Setup

This guide will help you push your Operations Tracker code to your GitHub repository.

## Repository
**GitHub URL:** https://github.com/bvggies/operation-tracker

## Step 1: Initialize Git (if not already done)

```bash
# Navigate to project root
cd D:\operations-tracker

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Operations Tracker - Construction Management System"
```

## Step 2: Connect to GitHub Repository

```bash
# Add remote repository
git remote add origin https://github.com/bvggies/operation-tracker.git

# Verify remote was added
git remote -v
```

## Step 3: Push to GitHub

```bash
# Set main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

If you encounter authentication issues, you may need to:

### Option A: Use Personal Access Token
1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate a new token with `repo` permissions
3. Use the token as password when pushing

### Option B: Use GitHub CLI
```bash
# Install GitHub CLI if not installed
# Then authenticate
gh auth login

# Push
git push -u origin main
```

### Option C: Use SSH (Recommended for long-term)
```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add SSH key to GitHub (copy public key)
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: Settings > SSH and GPG keys > New SSH key

# Change remote to SSH
git remote set-url origin git@github.com:bvggies/operation-tracker.git

# Push
git push -u origin main
```

## Step 4: Verify Upload

1. Go to https://github.com/bvggies/operation-tracker
2. Verify all files are uploaded
3. Check that the repository structure looks correct

## Step 5: Set Up .gitignore

Make sure your `.gitignore` file is in place to exclude:
- `node_modules/`
- `.env` files
- Build artifacts
- Upload directories

The `.gitignore` file should already be in the root directory.

## Step 6: Create Repository Description

On GitHub, add a description:
```
Construction Operations Tracker - Full-stack web application for managing construction projects, tasks, materials, equipment, and workforce. Built with React, Node.js, Express, and Neon PostgreSQL.
```

## Step 7: Add Topics/Tags

Add relevant topics to your repository:
- `react`
- `nodejs`
- `express`
- `postgresql`
- `construction-management`
- `operations-tracker`
- `vercel`
- `neon-database`

## Future Updates

After making changes, commit and push:

```bash
git add .
git commit -m "Description of changes"
git push
```

## Branching Strategy (Optional)

For better code management:

```bash
# Create a development branch
git checkout -b develop

# Make changes and commit
git add .
git commit -m "Your changes"

# Push development branch
git push -u origin develop

# Merge to main when ready
git checkout main
git merge develop
git push
```

## Troubleshooting

### If repository is not empty
If you need to merge with existing content:

```bash
git pull origin main --allow-unrelated-histories
# Resolve any conflicts
git push -u origin main
```

### If you need to force push (use with caution)
```bash
git push -u origin main --force
```

**Warning:** Only use `--force` if you're sure you want to overwrite remote content.

## Next Steps

After pushing to GitHub:

1. **Deploy to Vercel:**
   - Connect your GitHub repository to Vercel
   - Follow the deployment guide in `DEPLOYMENT.md`

2. **Set up Neon PostgreSQL:**
   - Create database
   - Run schema
   - Configure environment variables

3. **Update README:**
   - Add badges (optional)
   - Add screenshots (optional)
   - Update with your specific deployment URLs

