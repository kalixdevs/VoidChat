# How to Upload Project to GitHub

## Step 1: Install Git (if not already installed)

### Windows:
Download from: https://git-scm.com/download/win

### Check if Git is installed:
```bash
git --version
```

## Step 2: Configure Git (First time only)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 3: Login to GitHub

### Option A: Using GitHub CLI (Recommended)

1. Install GitHub CLI:
   - Windows: Download from https://cli.github.com/
   - Or use: `winget install GitHub.cli`

2. Login:
   ```bash
   gh auth login
   ```
   - Follow the prompts
   - Choose GitHub.com
   - Choose HTTPS
   - Authenticate via web browser

### Option B: Using Personal Access Token (PAT)

1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name: "Chat App"
4. Select scopes: `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

7. Use the token when pushing:
   ```bash
   git push
   # Username: your_github_username
   # Password: paste_your_token_here
   ```

### Option C: Using SSH (Advanced)

1. Generate SSH key:
   ```bash
   ssh-keygen -t ed25519 -C "your.email@example.com"
   ```

2. Add to GitHub:
   - Copy public key: `cat ~/.ssh/id_ed25519.pub`
   - Go to GitHub → Settings → SSH and GPG keys → New SSH key
   - Paste the key

## Step 4: Create GitHub Repository

### Option A: Using GitHub Website

1. Go to https://github.com/new
2. Repository name: `chatapp3.0` (or your preferred name)
3. Description: "Real-time chat application with React and Node.js"
4. Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

### Option B: Using GitHub CLI

```bash
gh repo create chatapp3.0 --public --description "Real-time chat application with React and Node.js"
```

## Step 5: Initialize Git and Upload

Open terminal in your project directory and run:

```bash
# Navigate to project root
cd C:\Users\nedas\OneDrive\Desktop\chatapp3.0

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Chat app with Google OAuth"

# Add remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/chatapp3.0.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 6: If you get authentication error

If you see authentication errors, use one of these:

### Using Personal Access Token:
```bash
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/chatapp3.0.git
git push -u origin main
```

### Or use GitHub CLI:
```bash
gh auth login
git push -u origin main
```

## Step 7: Verify Upload

1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/chatapp3.0`
2. You should see all your files there

## Future Updates

When you make changes and want to upload them:

```bash
# Check what files changed
git status

# Add changed files
git add .

# Commit changes
git commit -m "Description of your changes"

# Push to GitHub
git push
```

## Quick Reference Commands

```bash
# Check status
git status

# Add all files
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push

# Pull latest changes
git pull

# View commit history
git log

# Create new branch
git checkout -b feature-name

# Switch branches
git checkout main
```

## Important Notes

⚠️ **Never commit `.env` files** - They contain sensitive information!
- The `.gitignore` file I created will prevent this
- Always keep your `.env` files local

⚠️ **Before pushing, make sure:**
- `.env` files are in `.gitignore` ✅
- No passwords or secrets in code ✅
- Database credentials are not committed ✅

