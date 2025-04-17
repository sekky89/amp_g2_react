# 色々詰め込んだサンプル

## 前提

- VSCode

devcontainerを使う場合
- Docker

devcontainerを使わない場合
- node@22
- yarn@1
- aws-cli

## devcontainer

ベースは mcr.microsoft.com/devcontainers/typescript-node:22 です。
aws cli を導入しています。
加えて、[sst](https://sst.dev/), [orval](https://orval.dev/), [redocly](https://redocly.com/) をグローバルにインストールしています。

features
- common-utils: コンテナのシェルを zsh に変更

settings
- VSCode の拡張機能と設定をよしなに入れています。



## フロントエンド

- Amplify Gen2 でホスティング
- React + Vite(SWC)
- React Router v7 でパスベースのルーティングが可能

## バックエンド

- Amplify に組み込んでます。
- Lambda に prisma を組み込みます⭐️TBD
