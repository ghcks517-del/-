import { getDb } from "./firebase.js";
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { Regulation } from "../src/types/index.js";

export const RegulationRepository = {
  async getAllActive(): Promise<Regulation[]> {
    const db = getDb();
    const q = query(collection(db, "regulations"), where("active", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Regulation));
  },
  
  async getAll(): Promise<Regulation[]> {
    const db = getDb();
    const snapshot = await getDocs(collection(db, "regulations"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Regulation));
  },

  async getById(id: string): Promise<Regulation | null> {
    const db = getDb();
    const docRef = doc(db, "regulations", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Regulation;
  },

  async create(data: Omit<Regulation, "id">): Promise<Regulation> {
    const db = getDb();
    const docRef = await addDoc(collection(db, "regulations"), data);
    return { id: docRef.id, ...data } as Regulation;
  },

  async update(id: string, data: Partial<Regulation>): Promise<void> {
    const db = getDb();
    const docRef = doc(db, "regulations", id);
    await updateDoc(docRef, data as any);
  },
  
  async delete(id: string): Promise<void> {
    const db = getDb();
    const docRef = doc(db, "regulations", id);
    await deleteDoc(docRef);
  }
};
