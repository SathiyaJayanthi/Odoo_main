# TransitOps Setup Guide

This file describes how to prepare the development environment, install dependencies, and run the TransitOps backend and frontend locally.

## Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- npm (included with Node.js)
- Git

### Recommended Utilities

- `nvm` for Node version management
- Python virtual environment tooling (`venv`)

## Backend Setup

1. Open a terminal and change into the backend folder:

```bash
cd backend
```

2. Create a Python virtual environment:

```bash
python3 -m venv .venv
```

3. Activate the virtual environment:

- macOS / Linux:
  ```bash
  source .venv/bin/activate
  ```
- Windows PowerShell:
  ```powershell
  .venv\Scripts\Activate.ps1
  ```

4. Install requirements:

```bash
pip install -r requirements.txt
```

5. Run database migrations:

```bash
python manage.py migrate
```

6. Seed demo data (if available):

```bash
python manage.py seed_demo_data
```

7. Start the backend development server:

```bash
python manage.py runserver 8000
```

The backend API will be available at `http://localhost:8000/api/v1`.

## Frontend Setup

1. Open a second terminal and change into the frontend folder:

```bash
cd frontend
```

2. Install Node dependencies:

```bash
npm install
```

3. Start the Vite development server:

```bash
npm run dev -- --host 0.0.0.0
```

The frontend app will be available at `http://localhost:5173`.

## NVM Installation (Optional)

If Node is not installed on your machine, install `nvm` first:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
```

Then load nvm and install Node:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install --lts
```

## Notes

- The frontend assumes the backend API is hosted at `http://localhost:8000/api/v1`.
- If the backend runs on a different port, update the Axios base URL in `frontend/src/api/client.js`.
- Use the seeded demo accounts in `README.md` or `docs/README.md` to log in.
