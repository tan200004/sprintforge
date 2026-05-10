# SprintForge 🚀

Hey there! Welcome to **SprintForge**. 

I built this project because I wanted a simpler, faster way to handle project management. Think of it like a mashup of Jira, Linear, and Notion—but way lighter and easier to use. 

Whether you're working solo or with a team, this app helps you track bugs, plan sprints, and keep everything organized without feeling like you're fighting the software.

---

## 🛠 What's inside?

I used a modern JavaScript stack to put this together:

- **Frontend**: React 18, Vite, and Tailwind CSS. I also used Framer Motion for some nice animations and dnd-kit for the drag-and-drop Kanban board.
- **Backend**: Node.js and Express.js, connecting to a MongoDB database.
- **Real-time stuff**: Socket.IO makes sure you see updates instantly without refreshing.
- **Cool extras**: I threw in an AI assistant to help write bug reports and summarize meetings, plus a command palette (just hit `Ctrl+K`).

---

## 🚀 How to run it locally

If you want to spin this up on your own machine, it's pretty straightforward. You just need Node.js and MongoDB installed.

### 1. Grab the dependencies
Open two terminal windows. In the first one, get the backend ready:
```bash
cd backend
npm install
```

In the second one, do the same for the frontend:
```bash
cd frontend
npm install
```

### 2. Set up your environment variables
In the `backend` folder, create a `.env` file. You can copy this and just swap in your own details:
```env
MONGO_URI=mongodb://localhost:27017/sprintforge
JWT_ACCESS_SECRET=super_secret_string
JWT_REFRESH_SECRET=another_super_secret_string
CLIENT_URL=http://localhost:5173
```
*(Note: If you don't have a local MongoDB running, the app will actually fall back to a temporary in-memory database and create some dummy users for you so you can still test it out!)*

### 3. Fire it up!
Start the backend server:
```bash
cd backend
npm run dev
```

Start the React app:
```bash
cd frontend
npm run dev
```

Now just head over to `http://localhost:5173` in your browser.

---

## ☁️ Deployment

I've set this up so it's super easy to deploy on [Railway](https://railway.app). 

There's a `Dockerfile` right in the root folder. All you have to do is connect your GitHub repo to Railway, and it will automatically build both the React app and the Node server as a single full-stack service to keep things cheap and easy. Just don't forget to add your Environment Variables in the Railway dashboard!

---

## 🤝 Contributing

Feel free to fork this, submit PRs, or just use the code to learn. If you find a bug, open an issue!

License: MIT
