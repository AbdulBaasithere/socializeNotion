# SocializeNotion

SocializeNotion is a web application that combines the core features of Instagram (social sharing) with Notion-style productivity tools (rich-text notes, organization, collaboration).

## Features

**Social Sharing:**
- User profiles
- Media uploads (photos/videos) to personal feeds or shared group boards
- Likes and comments on posts
- Feed of posts from followed users

**Productivity & Organization:**
- Rich-text notes with headings, checklists, embedded media, and code blocks
- Content organization with folders and tags
- Page hierarchy
- Custom templates for notes

**Collaboration:**
- Real-time collaboration on pages
- Permission management for shared content

**General:**
- Modern UI/UX, mobile responsive with optional dark mode
- Save/bookmark content
- Notifications for likes, shares, comments, and page edits

## Technologies Used

**Backend:**
- Flask (Python)
- SQLAlchemy (ORM)
- SQLite (Database)
- Flask-CORS
- Flask-JWT-Extended

**Frontend:**
- React.js
- Vite (Build Tool)
- Tailwind CSS (Styling)
- Shadcn/ui (UI Components)
- Lucide Icons
- React Query (Data Fetching)
- React Router DOM (Routing)

## Setup and Installation

### Prerequisites
- Python 3.8+
- Node.js 18+
- pnpm (or npm/yarn)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/AbdulBaasithere/socializeNotion.git
cd socializeNotion
```

### 2. Backend Setup

Navigate to the `socializenotion-backend` directory:

```bash
cd socializenotion-backend
```

Create a Python virtual environment and activate it:

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows, use `.\venv\Scripts\activate`
```

Install the required Python packages:

```bash
pip install -r requirements.txt
```

Initialize the database (this will create `app.db` in `src/database/`):

```bash
python src/main.py
# Press Ctrl+C to stop the server after it starts for the first time to create the database.
```

### 3. Frontend Setup

Navigate to the `socializenotion-frontend` directory:

```bash
cd ../socializenotion-frontend
```

Install the Node.js dependencies:

```bash
pnpm install
# or npm install
# or yarn install
```

## Running the Application

### 1. Start the Backend Server

From the `socializenotion-backend` directory (with virtual environment activated):

```bash
python src/main.py
```

The backend server will run on `http://localhost:5000`.

### 2. Start the Frontend Development Server

From the `socializenotion-frontend` directory:

```bash
pnpm run dev --host
# or npm run dev -- --host
# or yarn dev --host
```

The frontend application will be accessible at `http://localhost:5173` (or another port if 5173 is in use).

## Deployment

For deployment, you would typically build the frontend for production and serve it with the Flask backend, or deploy them separately. 

**Frontend Build:**
```bash
cd socializenotion-frontend
pnpm run build
```
This will create a `dist` folder with the production-ready frontend assets. You can then configure your Flask app to serve these static files, or deploy the `dist` folder to a static hosting service.

