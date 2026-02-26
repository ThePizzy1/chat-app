import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getDatabase } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyA8GXx0qBXHr5plfcNns-M_BoqiY-jEb0o",
  authDomain: "message-58477.firebaseapp.com",
  databaseURL: "https://message-58477-default-rtdb.firebaseio.com",
  projectId: "message-58477",
  storageBucket: "message-58477.firebasestorage.app",
  messagingSenderId: "1069833921234",
  appId: "1:1069833921234:web:91b79c9226f85b8fbc030b"
};


const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getDatabase(app)