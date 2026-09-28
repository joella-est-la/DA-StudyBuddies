document.addEventListener("DOMContentLoaded", () => {
  const tutorForm = document.getElementById("tutorForm");
  const parentForm = document.getElementById("parentForm");
  const loginBtn = document.getElementById("loginBtn");
  const matchBtn = document.getElementById("matchBtn");
  const adminPanel = document.getElementById("adminPanel");
  const adminAuth = document.getElementById("adminAuth");

  // --- 1. SUBMIT TUTOR FORM TO FIREBASE ---
  tutorForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("tutorName").value.trim();
    const email = document.getElementById("tutorEmail").value.trim();
    const subjects = document.getElementById("tutorSubjects").value.trim();

    try {
      await window.dbTools.addDoc(window.dbTools.collection(window.db, "tutors"), {
        name,
        email,
        subjects,
        createdAt: new Date()
      });
      alert("Tutor successfully registered!");
      tutorForm.reset();
    } catch (err) {
      console.error("Error submitting tutor:", err);
      alert("Submission failed. Check your connection.");
    }
  });

  // --- 2. SUBMIT PARENT REQUEST TO FIREBASE ---
  parentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const parentName = document.getElementById("parentName").value.trim();
    const studentGrade = document.getElementById("studentGrade").value.trim();
    const subjectNeeded = document.getElementById("subjectNeeded").value.trim();

    try {
      await window.dbTools.addDoc(window.dbTools.collection(window.db, "students"), {
        parentName,
        studentGrade,
        subjectNeeded,
        createdAt: new Date()
      });
      alert("Request submitted successfully!");
      parentForm.reset();
    } catch (err) {
      console.error("Error submitting request:", err);
      alert("Submission failed. Check your connection.");
    }
  });

  // --- 3. ADMIN LOGIN ---
  loginBtn.addEventListener("click", () => {
    const pwd = document.getElementById("adminPassword").value;
    if (pwd === "DA_admin135") {
      adminAuth.classList.add("hidden");
      adminPanel.classList.remove("hidden");
      listenToCloudData(); // Start real-time sync across all devices!
    } else {
      alert("Incorrect admin password!");
    }
  });

  // --- 4. REAL-TIME CLOUD DATA LISTENER ---
  function listenToCloudData() {
    // Listen for Tutors
    window.dbTools.onSnapshot(window.dbTools.collection(window.db, "tutors"), (snapshot) => {
      const tutorsList = document.getElementById("tutorsList");
      tutorsList.innerHTML = "";
      if (snapshot.empty) tutorsList.innerHTML = "<p>No registered tutors.</p>";
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        tutorsList.innerHTML += `
          <div class="list-item">
            <strong>${data.name}</strong> (${data.email})<br/>
            Subjects: ${data.subjects}
          </div>`;
      });
    });

    // Listen for Parent Requests
    window.dbTools.onSnapshot(window.dbTools.collection(window.db, "students"), (snapshot) => {
      const requestsList = document.getElementById("requestsList");
      requestsList.innerHTML = "";
      if (snapshot.empty) requestsList.innerHTML = "<p>No pending requests.</p>";
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        requestsList.innerHTML += `
          <div class="list-item">
            <strong>Parent: ${data.parentName}</strong> (Grade: ${data.studentGrade})<br/>
            Needs help with: ${data.subjectNeeded}
          </div>`;
      });
    });

    // Listen for Matches
    window.dbTools.onSnapshot(window.dbTools.collection(window.db, "matches"), (snapshot) => {
      const matchesList = document.getElementById("matchesList");
      matchesList.innerHTML = "";
      if (snapshot.empty) matchesList.innerHTML = "<p>No matches generated yet.</p>";
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        matchesList.innerHTML += `
          <div class="list-item match-item">
            🎯 <strong>Match:</strong> ${data.tutorName} ↔️ ${data.parentName} (${data.subject})
          </div>`;
      });
    });
  }

  // --- 5. AUTOMATIC MATCHING ALGORITHM ---
  matchBtn.addEventListener("click", async () => {
    try {
      const tutorsSnap = await window.dbTools.getDocs(window.dbTools.collection(window.db, "tutors"));
      const studentsSnap = await window.dbTools.getDocs(window.dbTools.collection(window.db, "students"));

      let matchedCount = 0;

      for (let studentDoc of studentsSnap.docs) {
        const student = studentDoc.data();
        const neededSub = student.subjectNeeded.toLowerCase();

        for (let tutorDoc of tutorsSnap.docs) {
          const tutor = tutorDoc.data();
          const tutorSubs = tutor.subjects.toLowerCase();

          if (tutorSubs.includes(neededSub)) {
            // Save match to cloud
            await window.dbTools.addDoc(window.dbTools.collection(window.db, "matches"), {
              tutorName: tutor.name,
              tutorEmail: tutor.email,
              parentName: student.parentName,
              subject: student.subjectNeeded,
              matchedAt: new Date()
            });

            // Delete processed entries from queue
            await window.dbTools.deleteDoc(window.dbTools.doc(window.db, "tutors", tutorDoc.id));
            await window.dbTools.deleteDoc(window.dbTools.doc(window.db, "students", studentDoc.id));

            matchedCount++;
            break;
          }
        }
      }

      if (matchedCount > 0) {
        alert(`Successfully generated ${matchedCount} match(es)!`);
      } else {
        alert("No subject matches found between current tutors and requests.");
      }
    } catch (err) {
      console.error("Matching error:", err);
      alert("Error running match algorithm.");
    }
  });
});
