# GitHub Authentication Guide

## Step 1: Create Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `Vercel Deployment`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Click **"Generate token"**
6. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

## Step 2: Authenticate and Push

### Method A: Using Token in URL (One-time)

```powershell
cd D:\server_dashboard\dcw_dashboard-main

# Replace YOUR_TOKEN with your actual token
git push https://YOUR_TOKEN@github.com/asgar-dcw/inc_dashboard.git main
```

### Method B: Update Remote and Push (Recommended)

```powershell
cd D:\server_dashboard\dcw_dashboard-main

# Update remote URL with your username
git remote set-url origin https://asgar-dcw@github.com/asgar-dcw/inc_dashboard.git

# Push (will prompt for password - use your TOKEN, not password)
git push -u origin main
```

When prompted:
- **Username**: `asgar-dcw`
- **Password**: Paste your Personal Access Token (not your GitHub password)

### Method C: Store Credentials (Windows)

```powershell
# This will store credentials in Windows Credential Manager
git config --global credential.helper wincred

# Then push normally
git push -u origin main
```

## Step 3: Verify

After pushing, check:
- https://github.com/asgar-dcw/inc_dashboard
- You should see all your files!

## Troubleshooting

### "Permission denied"
- Make sure you're using a Personal Access Token, not your password
- Ensure the token has `repo` permissions
- Verify you have access to the `asgar-dcw/inc_dashboard` repository

### "Repository not found"
- Check that the repository exists
- Verify you have write access to the repository
- If it's a private repo, ensure your token has access

### "Authentication failed"
- Token might have expired (create a new one)
- Check token permissions
- Try using SSH instead (see below)

## Alternative: Use SSH (More Secure)

If you prefer SSH:

1. **Check for SSH key**:
   ```powershell
   ls ~/.ssh/id_ed25519.pub
   ```

2. **If no key, generate one**:
   ```powershell
   ssh-keygen -t ed25519 -C "your-email@example.com"
   # Press Enter to accept defaults
   ```

3. **Copy public key**:
   ```powershell
   cat ~/.ssh/id_ed25519.pub
   ```

4. **Add to GitHub**:
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Paste your public key
   - Save

5. **Update remote and push**:
   ```powershell
   git remote set-url origin git@github.com:asgar-dcw/inc_dashboard.git
   git push -u origin main
   ```

