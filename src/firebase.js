// Al inicio del componente AdminEscolar.js
import { initializeApp } from 'firebase/app';
import { getFirestore} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyB-dMhgHglAMdtrpOhss5X6ll3yg_iFueY",
  authDomain: "developers-a5e3f.firebaseapp.com",
  projectId: "developers-a5e3f",
  storageBucket: "developers-a5e3f.firebasestorage.app",
  messagingSenderId: "804977383960",
  appId: "1:804977383960:web:b1a720976423edf7d7c16d",
  measurementId: "G-3V29MVD8NL"
};



// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const rtdb = getDatabase(app);
const functions = getFunctions(app);

export { db, auth, rtdb, functions, httpsCallable };
export default app;