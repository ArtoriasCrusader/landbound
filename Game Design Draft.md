## 1. High Concept

Đây là một game puzzle endless kết hợp giữa **xếp khối kiểu Block Blast** và **mở rộng thế giới kiểu Dorfromantik**. Người chơi đặt các mảnh ghép gồm nhiều block địa hình vào một thế giới open world dạng grid vô hạn. Các block cùng loại khi nằm cạnh nhau sẽ nối thành cụm lớn. Người chơi cần hoàn thành các nhiệm vụ về cụm địa hình để nhận thêm mảnh ghép mới. Nếu hết mảnh ghép để đặt, game kết thúc.

## 2. Core Gameplay

Người chơi bắt đầu với **50 mảnh ghép** trong kho. Mỗi lượt, người chơi chỉ nhận và giữ **một piece in hand**. Người chơi phải đặt piece đó xuống board trước khi piece tiếp theo được spawn.

Mỗi mảnh ghép là một cụm nhiều block nhỏ, có hình dạng khác nhau như 1 ô, 2 ô, chữ L, hình vuông, zigzag, chữ T, v.v.

Mỗi block trong mảnh ghép thuộc một trong ba loại địa hình:

- Grass / Cây
- Water / Nước
- Dirt / Đất

Người chơi chọn một mảnh ghép và đặt nó lên thế giới grid vô hạn. Bàn chơi bắt đầu trống, nên piece đầu tiên có thể đặt tự do; từ piece thứ hai trở đi, mảnh không được chồng lên block đã có và phải nối cạnh với phần thế giới đã xây dựng. Sau khi đặt, các block cùng loại nằm cạnh nhau theo 4 hướng ngang/dọc sẽ được tính là cùng một cụm địa hình. Các block đã đặt tồn tại vĩnh viễn cho tới khi run kết thúc.

Một số piece sẽ có quest gắn vào một block cụ thể bên trong piece, gọi là **quest anchor block**. Sau khi piece được đặt xuống board, quest sẽ theo anchor block đó. Chỉ cluster cùng terrain được nối với anchor block mới được tính cho quest.

Quest yêu cầu cluster đạt một điều kiện nhất định. Có hai loại điều kiện:

- **At least**: cluster phải có số block **bằng hoặc lớn hơn** số yêu cầu.
- **Exactly**: cluster phải có số block **đúng bằng** số yêu cầu. Nếu cluster vượt quá số yêu cầu trước khi hoàn thành, quest bị fail ngay.

Ví dụ:

- Tạo cụm **10 block cây**
- Tạo cụm **8 block nước**
- Tạo cụm **12 block đất**

Khi quest hoàn thành, người chơi nhận thêm mảnh ghép mới. Nếu quest `at_least` chưa đạt sau khi đặt piece mang quest, quest vẫn ở trạng thái chờ và tiếp tục được kiểm tra khi các piece sau mở rộng cluster nối với anchor block. Game tiếp tục cho tới khi người chơi không còn mảnh nào để đặt.

## 3. Game Loop

```
Spawn một piece vào hand
→ Người chơi chọn vị trí đặt piece
→ Đặt piece vào bản đồ
→ Các block cùng loại nối thành cluster
→ Kiểm tra các quest đang `waiting` theo cluster chứa anchor block
→ Nếu quest hoàn thành: thưởng thêm piece và cộng điểm
→ Nếu quest `exactly` vượt mốc: quest fail và biến mất
→ Nếu còn piece trong kho: spawn piece tiếp theo
→ Nếu hết piece: thua
```

## 4. Win / Lose Condition

Game là **endless**, không có thắng tuyệt đối.

Người chơi thua khi không còn mảnh ghép nào trong kho. Vì thế giới là vô hạn và piece luôn có thể được đặt ở một vị trí mới nối với phần bản đồ hiện tại, prototype không có điều kiện thua do hết vị trí đặt.

Mục tiêu là:

- Sống càng lâu càng tốt.
- Hoàn thành càng nhiều nhiệm vụ càng tốt.
- Ghi điểm cao nhất có thể.

## 5. Board / Map

Prototype dùng một thế giới **square grid vô hạn**.

- Không có giới hạn kích thước như 12x12, 16x16 hay 30x30.
- Board lưu các cell đã đặt bằng tọa độ integer; chỉ render vùng đang nằm trong camera/viewport.
- Bàn chơi bắt đầu trống, không có starting piece hoặc board seed.
- Piece đầu tiên có thể đặt ở bất kỳ vị trí nào trong world.
- Từ piece thứ hai trở đi, người chơi chỉ được đặt mảnh mới nếu mảnh đó chạm cạnh với ít nhất một block đã có trên thế giới.
- Không cho đặt rời rạc ở xa phần thế giới hiện tại.
- Camera hỗ trợ pan và zoom để người chơi quan sát phần thế giới đã mở rộng.
- Mọi block đã đặt tiếp tục tồn tại và không bị xóa trong suốt run.

## 6. Piece System

Mỗi piece gồm nhiều cell nhỏ.

Ví dụ shape:

```
1 ô:
X

2 ô:
XX

3 ô thẳng:
XXX

L nhỏ:
X
XX

Vuông:
XX
XX

Zigzag:
XX
 XX

T:
XXX
 X

L 4 ô:
X
X
XX

4 ô thẳng:
XXXX
```

Mỗi cell trong piece có terrain type riêng.

Ví dụ một piece chữ L:

```
G W
G
```

Trong đó:

- `G` = Grass
- `W` = Water
- `D` = Dirt

Người chơi có thể **rotate piece 90 độ theo chiều kim đồng hồ** trước khi đặt bằng nút `Rotate` hoặc phím `R`. Prototype chưa hỗ trợ flip. Khi rotate, terrain của từng cell và vị trí tương đối của `quest anchor block` cùng rotate theo piece.

## 7. Terrain Connection Rule

Sau mỗi lần đặt piece:

- Các block cùng terrain type nối cạnh nhau theo 4 hướng sẽ tạo thành một cluster.
- Không tính nối chéo.
- Mỗi cluster có:
    - terrain type
    - số lượng block
    - danh sách block thuộc cluster

Ví dụ:

```
G G W
G W W
D D W
```

Cụm Grass có 3 block.  
Cụm Water có 4 block.  
Cụm Dirt có 2 block.

## 8. Quest System

Quest là nhiệm vụ gắn với một anchor block trên piece. Người chơi phải tạo hoặc mở rộng cluster cùng terrain với anchor block đó đạt kích thước yêu cầu.

Ví dụ quest:

```
Create a Grass cluster of 10 blocks.
Create a Water cluster of 8 blocks.
Create a Dirt cluster of 12 blocks.
```

Mỗi quest có:

```
{
  id: string,
  terrainType: "grass" | "water" | "dirt",
  comparison: "at_least" | "exactly",
  requiredSize: number,
  rewardPieces: number,
  status: "waiting" | "completed" | "failed",
  anchorCell: { x: number, y: number }
}
```

`failed` chỉ được sử dụng cho quest `exactly`. Quest `at_least` chỉ có hai trạng thái `waiting` và `completed`.

`anchorCell` là tọa độ của block mang quest bên trong piece trước khi đặt. Sau khi piece được đặt, tọa độ này được chuyển thành vị trí tương ứng trên board. Quest chỉ kiểm tra cluster chứa block này.

Sau mỗi lượt đặt:

- Quest `at_least` chuyển từ `waiting` sang `completed` khi cluster chứa anchor có kích thước `>= requiredSize`. Nếu chưa đạt, quest tiếp tục ở trạng thái `waiting`.
- Quest `exactly` chuyển sang `completed` khi cluster chứa anchor có kích thước `== requiredSize`.
- Quest `exactly` chuyển sang `failed` ngay khi cluster chứa anchor có kích thước `> requiredSize`.
- Quest đã `completed` không bị ảnh hưởng nếu cluster tiếp tục lớn thêm. Popup progress trên anchor block biến mất sau khi hoàn thành; badge/ký hiệu `Q` và viền anchor vẫn được giữ lại.

Ví dụ:

- Quest gắn vào một block Grass trên piece, yêu cầu `at_least 5 Grass`.
- Trên board đã có một cluster Grass 10 block.
- Người chơi đặt piece sao cho anchor Grass nối vào cluster đó.
- Cluster chứa anchor đạt 11 block hoặc hơn, nên quest hoàn thành ngay lập tức.
- Người chơi nhận thêm 5 mảnh mới.

Nếu piece mang quest `at_least` không nối được anchor vào cluster đủ lớn, quest không fail mà tiếp tục chờ các piece sau mở rộng đúng cluster đó.

Quest đang chờ hiển thị progress popup ngay trên anchor block trên board, ví dụ `≥ 9 / 10` hoặc `= 9 / 10`. Popup cập nhật sau mỗi lượt đặt và biến mất khi quest `exactly` bị fail.

## 9. Quest Spawn Rule

Prototype có thể dùng rule đơn giản:

- Quest không spawn thành danh sách quest global trên board. Quest được gắn vào một piece khi piece đó spawn vào hand.
- Tần suất spawn quest được điều khiển bởi một chỉ số riêng. Ví dụ, sau mỗi khoảng ngẫu nhiên **5–7 piece được spawn**, piece tiếp theo sẽ có một quest đi kèm.
- Ví dụ: sau khi người chơi đã đặt 5 piece, piece thứ 6 được spawn có thể mang quest.
- Quest được gắn vào một terrain block cụ thể trên piece và block đó trở thành anchor sau khi đặt.
- Complete hoặc fail quest không tự động spawn quest thay thế ngay lập tức. Quest tiếp theo chỉ xuất hiện theo chỉ số tần suất spawn.
- Terrain type và loại điều kiện (`at_least` hoặc `exactly`) được random khi tạo quest.
- Tỷ lệ condition hiện tại là **70% `at_least` và 30% `exactly`**.
- Required size được quyết định bởi difficulty: `at_least` cộng growth vào cluster baseline, còn `exactly` dùng target cố định theo tier.

Mức độ khó được phân hóa rõ theo lượng block cần thêm hoặc target cố định:

```
At least growth:
Easy:   +8–12 block (khoảng 10)
Normal: +18–22 block (khoảng 20)
Hard:   +28–32 block (khoảng 30)

Exactly target:
Easy:   8–12 block (khoảng 10)
Normal: 18–22 block (khoảng 20)
Hard:   28–32 block (khoảng 30)
```

## 10. Piece Economy

Người chơi có một kho piece. Tuy nhiên, mỗi lượt chỉ có một piece được spawn vào hand.

Gợi ý ban đầu:

- Start với **50 pieces**
- Mỗi lần đặt piece: mất 1 piece trong kho
- Sau khi đặt piece thành công: nhận/spawn piece tiếp theo nếu kho còn piece
- Hoàn thành quest: nhận thêm pieces theo difficulty và loại quest:
    - Easy `at_least`: +5–6 pieces; `exactly`: +5–7 pieces
    - Normal `at_least`: +6–8 pieces; `exactly`: +7–9 pieces
    - Hard `at_least`: +8–10 pieces; `exactly`: +9–10 pieces
- Mọi reward quest đều nằm trong giới hạn **5–10 pieces**.
- Nếu piece count về 0: game over

Có thể hiển thị:

```
Pieces Left: 7
Completed Quests: 3
Score: 450
```

## 11. Scoring

Prototype có thể dùng scoring đơn giản:

- Đặt 1 block: +1 điểm
- Hoàn thành quest: +100 điểm
- Bonus theo kích thước cluster hoàn thành: `clusterSize * 10`

Ví dụ:

```
Hoàn thành quest cụm nước 12 block:
+100 quest bonus
+120 cluster bonus
= +220 điểm
```

## 12. Controls

### Mobile Placement Controls

Camera controls giữ gesture quen thuộc trên mobile:

- Kéo một ngón trên vùng board trống để pan camera.
- Pinch bằng hai ngón để zoom in / zoom out.
- Khi đang giữ và kéo piece, camera bị khóa để gesture chỉ điều khiển piece.

Edge auto-pan khi kéo piece:

- Khi piece được kéo vào vùng rìa màn hình, camera tự pan theo hướng rìa đó.
- Dùng vùng kích hoạt khoảng 10–15% ở các mép trái, phải, trên và dưới màn hình.
- Có độ trễ ngắn trước khi pan để tránh kích hoạt nhầm.
- Camera bắt đầu chạy chậm và tăng tốc nhẹ khi piece tiến sát mép hơn.
- Khi ngón tay rời khỏi vùng rìa, camera dừng ngay.
- Piece vẫn bám theo ngón tay trong suốt quá trình camera pan.
- Preview xanh/đỏ được cập nhật liên tục theo vị trí mới của piece.
- Kéo vào góc màn hình có thể pan đồng thời theo hai hướng, nhưng tốc độ tổng thể cần được giới hạn.
- Khu vực `in-hand` và các nút UI không kích hoạt edge auto-pan.
- Không hỗ trợ pinch zoom trong lúc đang kéo piece; edge auto-pan là cách di chuyển camera chính trong trạng thái này.

Flow đặt piece:

1. Người chơi nhấn giữ thân piece trong khu vực `in-hand`.
2. Kéo piece trực tiếp lên board.
3. Khi thả tay, piece chuyển sang trạng thái `preview`, chưa được đặt chính thức.
4. Hiển thị vòng điều khiển quanh piece với ba nút:
   - `Rotate`: xoay piece 90 độ theo chiều kim đồng hồ.
   - `Cancel`: huỷ trạng thái preview và đưa piece về lại `in-hand`.
   - `Confirm`: xác nhận đặt piece.
5. Người chơi có thể nhấn giữ thân piece và kéo tiếp để đổi vị trí.
6. Có thể pan/zoom từ vùng board trống để kiểm tra tổng thể trong trạng thái `preview`.
7. Chỉ khi nhấn `Confirm` thì piece mới được đặt vĩnh viễn lên board.

Preview state rules:

- Chỉ có một piece ở trạng thái `preview` chưa được xác nhận trên board tại một thời điểm.
- Khi người chơi bắt đầu nhấn giữ piece trong `in-hand` lần nữa trong lúc đang có một preview chưa xác nhận, preview cũ bị huỷ và một preview mới được kéo lên.
- Việc kéo lại piece không tạo thêm piece và không làm mất piece trong kho.
- `Cancel` và `Rotate` luôn khả dụng trong preview.
- `Confirm` chỉ khả dụng khi toàn bộ footprint của piece hợp lệ.
- Chỉ sau khi `Confirm` mới trừ piece khỏi kho, ghi piece vào board, tạo cluster và kiểm tra quest.
- Piece đã `Confirm` và trở thành một phần của board không bị huỷ bởi thao tác kéo lại piece trong `in-hand`.

Placement feedback:

- Vị trí hợp lệ hiển thị preview màu xanh.
- Khi piece bị chồng lên các block đã có trên board, chỉ những block của piece đang bị chồng mới được phủ/viền đỏ để báo lỗi.
- Các block còn lại của piece không bị chồng vẫn giữ màu terrain và trạng thái preview bình thường.
- `Confirm` bị vô hiệu hóa khi piece đang ở vị trí không hợp lệ.
- `Cancel` và `Rotate` vẫn có thể nhấn khi piece đang ở vị trí không hợp lệ.
- Piece không bị mất nếu người chơi thả ở vị trí không hợp lệ.
- Vòng điều khiển tự đổi hướng khi piece nằm gần mép màn hình, tránh bị cắt khỏi viewport.
- Thân piece là vùng kéo; các nút trong vòng điều khiển không bắt đầu thao tác pan camera.

Prototype desktop:

- Hiển thị piece hiện tại trong hand.
- Hover lên board để preview vị trí đặt.
- Click lên board để đặt.
- Nút `Rotate` hoặc phím `R`: rotate piece 90 độ theo chiều kim đồng hồ.
- Không cần flip.

Nếu piece có quest, block anchor được đánh dấu rõ bằng badge/ký hiệu `Q` và viền nổi bật trên piece preview, preview trên board và trên board sau khi đặt. Ký hiệu này phải đi theo đúng anchor block khi piece được rotate.

Khi piece đang ở trạng thái preview trên board, hiển thị popup thông tin quest ngay phía trên block anchor của piece đó. Popup gồm difficulty, terrain, loại điều kiện (`≥` hoặc `=`), required size và reward để người chơi biết quest trước khi đặt piece.

Khi quest đã được đặt lên board, hiển thị popup progress trên anchor block, gồm terrain, loại điều kiện (`≥` hoặc `=`) và tiến trình hiện tại trên required size. Khi quest hoàn thành, popup progress biến mất; badge/ký hiệu `Q` và viền của anchor vẫn được giữ lại để nhận diện block quest đã hoàn thành. Quest detail không hiển thị ở sidebar bên phải; thông tin chính phải nằm trên anchor trong board preview hoặc trên board.

Nếu vị trí hợp lệ:

- Preview viền xanh.

Nếu không hợp lệ do collision:

- Chỉ các block bị chồng hiển thị phủ/viền đỏ.
- Các block không bị chồng không bị tô đỏ.

## 13. MVP Requirements

Codex cần làm prototype có các tính năng sau:

### Board

- Render phần viewport hiện tại của grid vô hạn.
- Hiển thị các block đã đặt và giữ chúng tồn tại vĩnh viễn trong run.
- Hỗ trợ pan và zoom camera để quan sát thế giới đã mở rộng.
- Mỗi terrain type có màu riêng:
    - Grass = green
    - Water = blue
    - Dirt = brown/yellow

### Pieces

- Mỗi lượt chỉ hiển thị một piece hiện tại trong hand.
- Mỗi piece là polyomino gồm nhiều block terrain.
- Hỗ trợ rotate piece 90 độ theo chiều kim đồng hồ bằng nút `Rotate` hoặc phím `R`.
- Khi rotate, `quest anchor block` phải giữ đúng identity và rotate cùng piece.
- Nếu piece có quest, hiển thị quest condition và đánh dấu quest anchor block.
- Hover board để preview.
- Click board để đặt.

### Placement Rules

- Không cho đặt chồng lên block đã có.
- Piece đầu tiên được đặt tự do khi board còn trống.
- Từ piece thứ hai trở đi, piece phải chạm cạnh với ít nhất một block đã có.
- Không có giới hạn biên của board.

### Cluster Detection

- Sau mỗi lần đặt, chạy flood fill / BFS để tìm cluster cùng terrain.
- Cluster nối theo 4 hướng.
- Không nối chéo.

### Quests

- Quest được gắn vào một block cụ thể trên piece.
- Chỉ cluster cùng terrain nối với anchor block mới được tính.
- Có hai loại condition: `at_least` và `exactly`.
- Quest `at_least` có trạng thái `waiting` hoặc `completed`.
- Quest `exactly` có trạng thái `waiting`, `completed` hoặc `failed`.
- Quest được spawn theo chỉ số tần suất, khoảng mỗi 5–7 piece.
- Quest đang `waiting` hiển thị progress popup trên anchor block, ví dụ `≥ 9 / 10`.
- Quest đã `completed` không còn hiển thị progress popup trên anchor block; badge/ký hiệu `Q` và viền anchor vẫn được giữ lại để nhận diện.
- Khi quest hoàn thành:
    - Đánh dấu `completed`
    - Cộng điểm
    - Thưởng thêm pieces
- Khi quest `exactly` vượt quá required size:
    - Đánh dấu `failed`
    - Quest biến mất
    - Không spawn quest thay thế ngay lập tức

### Game Over

Game over khi:

- Người chơi hết pieces.

## 14. Suggested Data Structure

```
const TERRAIN = {
  GRASS: "grass",
  WATER: "water",
  DIRT: "dirt"
};

const board = new Map([
  ["0,0", { x: 0, y: 0, terrain: "grass" }],
  ["1,0", { x: 1, y: 0, terrain: "grass" }],
]);

const piece = {
  id: "piece_01",
  cells: [
    { x: 0, y: 0, terrain: "grass" },
    { x: 1, y: 0, terrain: "water" },
    { x: 0, y: 1, terrain: "grass" }
  ],
  rotation: 0,
  quest: {
    terrainType: "grass",
    comparison: "at_least",
    requiredSize: 5,
    rewardPieces: 5,
    status: "waiting",
    anchorCell: { x: 0, y: 0 },
    anchorWorld: null
  }
};
```

Piece không có quest có thể dùng `quest: null`.

## 15. Prototype Feel

Game nên có cảm giác:

- Chill
- Dễ hiểu
- Ít UI phức tạp
- Tập trung vào việc mở rộng thế giới vô hạn
- Người chơi luôn phải cân nhắc: “đặt mảnh này ở đâu để cụm địa hình lớn lên và hoàn thành quest?”

Không cần art đẹp trong prototype. Chỉ cần màu rõ, feedback placement rõ, quest rõ.

## 16. One-Sentence Description

Một game endless puzzle nơi người chơi đặt các mảnh ghép địa hình vào một thế giới grid vô hạn, nối các block cùng loại thành cụm lớn để hoàn thành nhiệm vụ và nhận thêm mảnh ghép trước khi cạn tài nguyên.
