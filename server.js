import express from "express";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, increment, setDoc, deleteDoc } from "firebase/firestore";

const app = express();

const firebaseConfig = {
  apiKey: "AIzaSyCLYolXw8R39GdEVcDKxtNNRnyTzyFsE1I",
  authDomain: "talisaycitycollege-af6ec.firebaseapp.com",
  projectId: "talisaycitycollege-af6ec",
  storageBucket: "talisaycitycollege-af6ec.firebasestorage.app",
  messagingSenderId: "661165909340",
  appId: "1:661165909340:web:11d8d7eb79cd14abab4d99"
};

const db = getFirestore(initializeApp(firebaseConfig));

app.get("/cleanup", async (req, res) => {
  const now = new Date();
  const snapshot = await getDocs(collection(db, "reservations"));

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const resId = docSnap.id;
    const endDateTime = data.endTime ? new Date(data.endTime) : null;
    let status = data.status || "Active";

    if (status === "Active" && endDateTime && now > endDateTime) {
      if (Array.isArray(data.equipment)) {
        for (const equip of data.equipment) {
          const eqRef = doc(db, "equipment", equip);
          await updateDoc(eqRef, { quantity: increment(1) });
        }
      }

      await setDoc(doc(db, "history", resId), { ...data, status: "No-Show" });
      await deleteDoc(doc(db, "reservations", resId));

      console.log(`⏰ Reservation ${resId} moved to history (No-Show)`);
    }
  }

  res.send("✅ Cleanup finished");
});

app.listen(3000, () => console.log("🚀 Cleanup service running on port 3000"));
