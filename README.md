# チャイムまでに帰れ！

平成の学校を舞台にした、スマホ縦持ち向けの2Dステルス・タイムアタックブラウザゲームです。先生の視界で走るとアウト、歩いているだけならセーフ。制限時間内に校舎内の目的地へ向かいます。

## 開発環境

- Vite
- TypeScript
- Phaser 3
- 論理解像度: 390 x 844
- 想定操作: スマホ縦持ちタッチ操作

## 起動方法

```bash
npm install
npm run dev
```

開発サーバーは `http://localhost:5173` で起動します。

## ビルド方法

```bash
npm run build
```

生成物は `dist` に出力されます。公開前は必ずこのコマンドが成功することを確認します。

## Vercel公開手順

1. GitHubなどにリポジトリを push します。
2. Vercelで新規Projectを作成し、このリポジトリをImportします。
3. Framework Preset は `Vite` を選びます。
4. Build Command は `npm run build` を指定します。
5. Output Directory は `dist` を指定します。
6. Install Command は通常どおり `npm install` で問題ありません。
7. 環境変数は基本不要です。本番でデバッグを有効にしないため、`VITE_DEBUG_MODE` は未設定または `false` にしてください。
8. 限定公開はVercelのPreview URL共有、またはVercel側のProtection機能で運用します。

`vercel.json` では SPA 用の rewrite、build command、output directory を指定しています。

## 遊び方

- 左下スティックで移動
- 右下DASH長押しで走る
- 先生の視界で走るとゲームオーバー
- 歩いているだけなら見られてもセーフ
- チャイムまでにゴールへ向かう
- レベルをクリアすると校舎図が解放される
- 全レベルクリアでミニゲーム解放

## 進行保存

進行状況は `ProgressManager` 経由で `localStorage` に保存します。保存される値は以下です。

- `unlockedLevel`
- `clearedLevels`
- `miniGameUnlocked`

`unlockedMapAreas` と `clearRate` は `ProgressManager.getSummary()` で表示用に算出します。Level 1チュートリアル表示済みフラグは別キーで `localStorage` に保存します。

## デバッグ表示

本番ビルドではデバッグ表示は出しません。開発時は `DEBUG_MODE` が有効な状態で `?debug` を付けると、GameScene内に以下が表示されます。

- currentLevel
- player position
- remaining time
- walkable状態
- isDashing
- isInTeacherVision
- teacher state
- input source

## スマホ実機確認項目

- 画面が縦持ちで崩れない。
- ブラウザのスクロール、ピンチズーム、ダブルタップズームがゲーム操作を邪魔しない。
- 左下スティックを離すとプレイヤーが必ず停止する。
- 右下DASHを離すと `isDashing=false` になる。
- スティック操作とDASH長押しを同時に使える。
- 先生の視界内で歩いてもゲームオーバーにならない。
- 先生の視界内でダッシュすると「先生の前で走ってしまった！」で失敗する。
- 時間切れ時は「チャイムに間に合わなかった！」で失敗する。
- ゴール到達時にクリアになる。
- Level 1からLevel 5まで順番に解放される。
- Level 5クリア後に校舎図全解放とミニゲーム解放が行われる。
- リロード後も進行状況が保持される。
- 校舎図へ戻る、リトライ、次のレベルへ進むボタンが機能する。
- ミニゲームから校舎図へ戻れる。

## 既知のTODO

- OGP画像は未作成。現状はfaviconのみ設定。
- 効果音とBGMは未実装。追加する場合は初回タップ後に再生開始する。
- 端末ごとの実プレイ難易度は限定公開後のフィードバックで調整する。
- 画像アセットはまだ簡易図形中心。必要に応じて `public/assets` 配下へ差し替え用素材を追加する。
