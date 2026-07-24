# Landbound prototype

Prototype web game cho concept endless terrain puzzle.

## Chạy local

```powershell
node dev-server.cjs
```

Nếu terminal chưa nhận lệnh `node`, dùng runtime đã bundle trong Codex:

```powershell
& "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" dev-server.cjs
```

Sau đó mở `http://127.0.0.1:4173`.

## Choi trong cung mang LAN

May chay game lam may chu:

1. Mo PowerShell trong thu muc game.
2. Chay `node dev-server.cjs`.
3. Server se in ra mot dong dang `LAN: http://192.168.1.23:4173`.
4. Tren may tinh khac dang dung cung Wi-Fi hoac mang LAN, mo dung dia chi LAN do bang trinh duyet.

May chu phai giu cua so PowerShell va server dang chay trong suot luc choi. Day la cach chia se ban web de moi may choi mot phien rieng; hien tai chua phai che do multiplayer dung chung mot ban choi.

Neu may khac khong truy cap duoc, Windows Firewall co the dang chan cong 4173. Co the mo PowerShell bang quyen Administrator tren may chu va chay:

```powershell
New-NetFirewallRule -DisplayName "Landbound LAN 4173" -Direction Inbound -Protocol TCP -LocalPort 4173 -Action Allow -Profile Private
```

Chi chia se dia chi nay trong mang tin cay. Khong mo cong nay ra Internet.

## Continuous deploy voi Netlify

Project da co `netlify.toml` voi publish directory la thu muc goc. Sau khi lien ket repository voi Netlify, moi lan push commit len nhanh production, Netlify se tu dong deploy lai.

```powershell
git add .
git commit -m "Update game"
git push
```

## Controls

- Click: đặt piece
- Nút `Rotate` hoặc phím `R`: xoay piece 90 độ theo chiều kim đồng hồ
- Kéo chuột giữa/phải hoặc giữ `Shift`/`Alt`: pan camera
- Mouse wheel: zoom
- `Restart`: tạo run mới

## Core prototype rules

- Thế giới là square grid vô hạn; chỉ các cell đã đặt mới được lưu.
- Piece phải nối cạnh với thế giới hiện tại.
- Mỗi lượt chỉ có một piece trong hand; đặt xong mới spawn piece tiếp theo.
- Block đã đặt không biến mất trong run.
- Quest gắn với một anchor block và chỉ tính cluster nối với anchor đó.
