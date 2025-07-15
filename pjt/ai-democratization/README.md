# Lumine Data Intelligence Platform

This is a [Next.js](https://nextjs.org) project for Lumine's AI-powered data intelligence platform with chat interface.

## Features

- 🤖 Chat-based interface for data queries
- 🔄 Integration with n8n workflow for data processing
- 🌐 Japanese language support
- 📊 Real-time data analysis

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory and add the following:

```bash
# n8nワークフローのWebhook URL（TEST URLを使用）
N8N_WEBHOOK_URL=https://clado.app.n8n.cloud/webhook-test/simple-test-20250714

# 注意: n8nのバグのため、Production URLは機能しません
# 必ずTest URLを使用してください
```

### 3. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## n8n Workflow Integration

The application integrates with an n8n workflow (`lmn_n8n.json`) that processes data queries through the following steps:

1. **Japanese Query Reception**: Receives user queries in Japanese
2. **Translation**: Translates Japanese to English using GPT-4
3. **SQL Generation**: Generates SQL queries using Amazon Q simulation
4. **Database Execution**: Executes queries on Redshift
5. **Result Explanation**: Provides Japanese explanations of results
6. **Response**: Returns formatted JSON response

### Setting up n8n Workflow

1. Import the `lmn_n8n.json` file into your n8n instance
2. Configure the webhook URL in your environment variables
3. Set up the required credentials (OpenAI API, Redshift connection)

## Development

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Geist, a new font family for Vercel.
