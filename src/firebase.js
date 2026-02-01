import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  update,
  push,
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCPT62P_er0Dzpa5-g4FX_ZiKVSrhJv4Co",
  authDomain: "iot-disaster-management.firebaseapp.com",
  databaseURL: "https://iot-disaster-management-default-rtdb.firebaseio.com",
  projectId: "iot-disaster-management",
  storageBucket: "iot-disaster-management.firebasestorage.app",
  messagingSenderId: "625293960447",
  appId: "1:625293960447:web:cde97a662f5326c95f18ca",
  measurementId: "G-P06CFRQKWZ",
};

const app = initializeApp(firebaseConfig);

const database = getDatabase(app);

export { database, ref, set, get, onValue, update, push };
