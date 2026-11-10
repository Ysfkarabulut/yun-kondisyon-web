$token = (gh auth token).Trim()
Set-Location "C:\Users\ASUS\Desktop\Projeler\YunKondisyonTesti\web"
git add .
git commit -m "feat: auto calculate condition percent from condition kg and net kg with manual override"
git remote set-url origin "https://${token}@github.com/Ysfkarabulut/yun-kondisyon-web.git"
git push origin main
git remote set-url origin "https://github.com/Ysfkarabulut/yun-kondisyon-web.git"
Write-Output "Push complete!"
