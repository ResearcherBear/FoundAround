import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db, auth } from "./firebase-config.js";

// 🔧 Admin accounts are NOT stored in Firestore like scholars are.
// They live in Firebase Console > Authentication > Users. Add an
// admin's email + password there, and they'll be able to log in here.
// (This also means you can add/remove/change admin passwords any time
// from the Firebase Console, without touching this code.)

const loginPanel = document.getElementById("loginPanel");
const loginHeading = document.getElementById("loginHeading");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const adminLoginBtn = document.getElementById("adminLoginBtn");

const dashboardPanel = document.getElementById("dashboardPanel");
const scholarTableBody = document.getElementById("scholarTableBody");
const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");

function showPanel(panel) {
  [loginPanel, dashboardPanel].forEach((p) => p.classList.add("hidden"));
  panel.classList.remove("hidden");
}

// Whenever auth state changes (login, logout, or a returning admin whose
// session is still valid) show the right panel automatically.
onAuthStateChanged(auth, (user) => {
  if (user) {
    showPanel(dashboardPanel);
    loadScholars();
  } else {
    showPanel(loginPanel);
  }
});

// --- Login step ----------------------------------------------------------

adminLoginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  adminLoginBtn.disabled = true;
  loginHeading.textContent = "Checking...";
  loginHeading.style.color = "";

  try {
    await signInWithEmailAndPassword(auth, adminEmail.value.trim(), adminPassword.value);
    // onAuthStateChanged above takes care of switching to the dashboard
  } catch (err) {
    console.error(err);
    loginHeading.textContent = "Invalid email or password";
    loginHeading.style.color = "#c5221f";
  } finally {
    adminLoginBtn.disabled = false;
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// --- Dashboard step --------------------------------------------------

refreshBtn.addEventListener("click", loadScholars);

async function loadScholars() {
  scholarTableBody.innerHTML = `<tr><td colspan="3">Loading...</td></tr>`;

  try {
    const scholarsRef = collection(db, "scholars");
    const snapshot = await getDocs(scholarsRef);

    if (snapshot.empty) {
      scholarTableBody.innerHTML = `<tr><td colspan="3">No scholars registered yet</td></tr>`;
      return;
    }

    // Pulled and sorted here (rather than with a Firestore orderBy) so
    // scholars who haven't scored anything yet - i.e. no "points" field -
    // still show up, just at the bottom with a score of 0.
    const scholars = snapshot.docs.map((docSnap) => docSnap.data());
    scholars.sort((a, b) => (b.points || 0) - (a.points || 0));

    scholarTableBody.innerHTML = "";
    scholars.forEach((data, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${data.scholarId ?? "-"}</td>
        <td>${data.points || 0}</td>
      `;
      scholarTableBody.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    scholarTableBody.innerHTML = `<tr><td colspan="3">Error loading scholars: ${err.message}</td></tr>`;
  }
}
