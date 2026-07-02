import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { Employee, MonthlyRecord, AppSettings, ActivityLog } from './types';
import {
  INITIAL_EMPLOYEES,
  INITIAL_RECORDS,
  INITIAL_SETTINGS,
  INITIAL_LOGS
} from './data/initialData';

// Config sourced from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyCdKstz3rSDjWtdgdOpFavMm80Ktqf_nA4",
  authDomain: "erp-paie.firebaseapp.com",
  projectId: "erp-paie",
  storageBucket: "erp-paie.firebasestorage.app",
  messagingSenderId: "949905597095",
  appId: "1:949905597095:web:3b6e62dd5ffda356f8f182"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "default");
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Firestore Collection References
const employeesCol = collection(db, 'employees');
const recordsCol = collection(db, 'records');
const settingsCol = collection(db, 'settings');
const logsCol = collection(db, 'logs');

// Seed helper: Seeds data if empty
export async function seedDatabaseIfEmpty() {
  const empSnap = await getDocs(employeesCol);
  if (empSnap.empty) {
    console.log("Seeding employees...");
    const batch = writeBatch(db);
    INITIAL_EMPLOYEES.forEach((emp) => {
      const docRef = doc(db, 'employees', emp.id);
      batch.set(docRef, emp);
    });
    await batch.commit();
  }

  const recSnap = await getDocs(recordsCol);
  if (recSnap.empty) {
    console.log("Seeding monthly records...");
    const batch = writeBatch(db);
    INITIAL_RECORDS.forEach((rec) => {
      const docRef = doc(db, 'records', rec.id);
      batch.set(docRef, rec);
    });
    await batch.commit();
  }

  const settingsSnap = await getDocs(settingsCol);
  if (settingsSnap.empty) {
    console.log("Seeding settings...");
    await setDoc(doc(db, 'settings', 'app'), INITIAL_SETTINGS);
  }

  const logsSnap = await getDocs(logsCol);
  if (logsSnap.empty) {
    console.log("Seeding logs...");
    const batch = writeBatch(db);
    INITIAL_LOGS.forEach((log) => {
      const docRef = doc(db, 'logs', log.id);
      batch.set(docRef, log);
    });
    await batch.commit();
  }
}

// --- EMPLOYEES CRUD ---
export async function dbGetEmployees(): Promise<Employee[]> {
  const snap = await getDocs(employeesCol);
  const list: Employee[] = [];
  snap.forEach((doc) => {
    list.push(doc.data() as Employee);
  });
  return list;
}

export async function dbSaveEmployee(emp: Employee): Promise<void> {
  await setDoc(doc(db, 'employees', emp.id), emp);
}

export async function dbDeleteEmployee(empId: string): Promise<void> {
  await deleteDoc(doc(db, 'employees', empId));
}

// --- RECORDS CRUD ---
export async function dbGetRecords(): Promise<MonthlyRecord[]> {
  const snap = await getDocs(recordsCol);
  const list: MonthlyRecord[] = [];
  snap.forEach((doc) => {
    list.push(doc.data() as MonthlyRecord);
  });
  return list;
}

export async function dbSaveRecord(rec: MonthlyRecord): Promise<void> {
  await setDoc(doc(db, 'records', rec.id), rec);
}

export async function dbDeleteRecord(recId: string): Promise<void> {
  await deleteDoc(doc(db, 'records', recId));
}

// --- SETTINGS CRUD ---
export async function dbGetSettings(): Promise<AppSettings> {
  const snap = await getDocs(settingsCol);
  if (snap.empty) {
    return INITIAL_SETTINGS;
  }
  let settings = INITIAL_SETTINGS;
  snap.forEach((doc) => {
    if (doc.id === 'app') {
      settings = doc.data() as AppSettings;
    }
  });
  return settings;
}

export async function dbSaveSettings(settings: AppSettings): Promise<void> {
  await setDoc(doc(db, 'settings', 'app'), settings);
}

// --- LOGS CRUD ---
export async function dbGetLogs(): Promise<ActivityLog[]> {
  const snap = await getDocs(logsCol);
  const list: ActivityLog[] = [];
  snap.forEach((doc) => {
    list.push(doc.data() as ActivityLog);
  });
  // Sort by date desc
  return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function dbSaveLog(log: ActivityLog): Promise<void> {
  await setDoc(doc(db, 'logs', log.id), log);
}
