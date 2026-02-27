# Agent Chat Application (Frontend)

A React-based chat interface powered by a LLM backend. Supports conversation management, AI-generated slide presentations, and full authentication flows.

> **Backend Repository:** [agent_chat_application_backend](https://github.com/dgbao03/agent_chat_application_backend)

---

## Features

### Authentication
- Sign up with email and password
- Sign in with email or Google OAuth
- Forgot password / reset password via email link
- Persistent sessions with automatic token refresh

### Agent Chat
- Real-time conversation with an LLM agent
- Markdown rendering with syntax-highlighted code blocks
- Conversation history with sidebar navigation
- Rename and delete conversations
- Search across all conversations

### AI Generated Presentation 
- Preview AI-generated HTML slide presentations inline
- Multi-page slide navigation
- Version history — browse and switch between previous versions
- Fullscreen presentation mode with keyboard navigation (←, →, Space, Esc)
- HTML source view for each slide
- Download panel (coming soon: PPTX, PDF, HTML, Google Slides)

---

## Tech Stack

| Category | Library |
|----------|---------|
| Framework | React 19 + TypeScript |
| Build tool | Vite 7 |
| Routing | React Router DOM 7 |
| Styling | Tailwind CSS 4 |
| Markdown | react-markdown + react-syntax-highlighter |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Backend server running — [Backend Repository](https://github.com/dgbao03/agent_chat_application_backend)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd agent_chat_frontend

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:4040
```

> This should point to the running backend server URL.

### Run

```bash
npm run dev
```

The app will be available at `http://localhost:5174`.

---

## Demo

### Sign In

![Sign In](https://res.cloudinary.com/dw3x8orox/image/upload/v1772208932/Screenshot_2026-02-27_at_23.13.49_oactes.png)

### Sign Up

![Sign Up](https://res.cloudinary.com/dw3x8orox/image/upload/v1772208932/Screenshot_2026-02-27_at_23.14.03_ted3ha.png)

### Chat UI

![Chat UI 1](https://res.cloudinary.com/dw3x8orox/image/upload/v1772208933/Screenshot_2026-02-27_at_23.12.42_syyuac.png)

![Chat UI 2](https://res.cloudinary.com/dw3x8orox/image/upload/v1772208933/Screenshot_2026-02-27_at_23.12.52_hrwaoq.png)

![Chat UI 3](https://res.cloudinary.com/dw3x8orox/image/upload/v1772208933/Screenshot_2026-02-27_at_23.13.33_uc2umz.png)

---

## License

MIT License

Copyright (c) 2026 BaoDo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
()