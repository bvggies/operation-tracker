# PowerShell script to create .env file
# Run this script: .\create-env.ps1

$envContent = @"
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://neondb_owner:npg_IPuJvF7j8WzK@ep-purple-wave-ahboae4g-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
"@

$envContent | Out-File -FilePath ".env" -Encoding utf8
Write-Host ".env file created successfully!" -ForegroundColor Green

