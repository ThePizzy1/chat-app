# Vue.js Firebase Chat App

A real-time chat application built with **Vue.js 3** and **Firebase**. Users can register, log in (email/password or Google), edit their profile (name, password, avatar), and chat with other users in real-time.

## Features

- User authentication (email/password & Google)
- Profile management (name, password, avatar)
- Real-time chat with other users
- Messages per hour graph using Chart.js
- Responsive layout with mobile-friendly drawer

## Technologies

- Vue.js 3 (Composition API)
- Firebase Authentication & Realtime Database
- Chart.js
- TailwindCSS
- SweetAlert2

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/vue-firebase-chat.git
cd vue-firebase-chat
```
### 2. Install dependencies
```
npm install
# or
yarn install
```
### 3. Run the app

```
npm run dev
# or
yarn dev
```
### Usage
1. Register using email/password or Google.

2. Select an avatar.

3. Start chatting by selecting a user from the list.

4. Edit your profile using the Edit button to change your name, password, or avatar.

5. Check the messages per hour graph using the 📊 button.

### Notes

- Passwords require 8+ characters, uppercase, lowercase, number, and symbol.

- The app is responsive, mobile users see a drawer for user selection.

- Users remain logged in after page refresh due to Firebase auth listener.
