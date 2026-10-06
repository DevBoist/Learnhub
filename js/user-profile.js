import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const db = getFirestore();

export async function getUserProfile(user) {
  const profileRef = doc(db, "users", user.uid);
  const profile = await getDoc(profileRef);
  if (profile.exists()) return profile.data();

  const legacyProfiles = await getDocs(query(collection(db, "users"), where("uid", "==", user.uid)));
  if (legacyProfiles.empty) return null;

  const legacy = legacyProfiles.docs[0].data();
  const data = {
    uid: user.uid,
    email: user.email,
    firstname: legacy.firstname,
    lastname: legacy.lastname,
    role: legacy.role,
  };
  await setDoc(profileRef, data);
  return data;
}
