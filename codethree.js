// Global memory variables (synced with Firebase Firestore)
let tutors = [];
let students = [];
let matches = [];

// Simple State Tracking for Admin Auth
let isAdminUnlocked = false;

// Real-Time Cloud Data Listener (Syncs across mobile and desktop)
function initFirebaseSync() {
    if (!window.dbTools || !window.dbTools.onSnapshot) return;

    // Sync Tutors from Cloud
    window.dbTools.onSnapshot(window.dbTools.collection(window.db, "tutors"), (snapshot) => {
        tutors = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        if (isAdminUnlocked) renderDashboard();
    });

    // Sync Students from Cloud
    window.dbTools.onSnapshot(window.dbTools.collection(window.db, "students"), (snapshot) => {
        students = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        if (isAdminUnlocked) renderDashboard();
    });

    // Sync Matches from Cloud
    window.dbTools.onSnapshot(window.dbTools.collection(window.db, "matches"), (snapshot) => {
        matches = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        if (isAdminUnlocked) renderDashboard();
    });
}

// Navigation engine
function switchTab(tabId) {
    if (tabId === 'admin-dashboard' && !isAdminUnlocked) {
        document.getElementById('admin-auth').style.display = 'block';
        document.getElementById('admin-panel').style.display = 'none';
    } else if (tabId === 'admin-dashboard' && isAdminUnlocked) {
        document.getElementById('admin-auth').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        renderDashboard();
    }

    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// Password verification gate
function checkAdminPassword() {
    const enteredPass = document.getElementById('adminPassword').value;
    const errorMsg = document.getElementById('passwordError');

    if (enteredPass === 'DA_admin135') {
        isAdminUnlocked = true;
        errorMsg.style.display = 'none';
        document.getElementById('admin-auth').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        renderDashboard();
    } else {
        errorMsg.style.display = 'block';
    }
}

// Handle other language text input box visibility
function toggleOtherLanguageText(role, isChecked) {
    const otherInput = document.getElementById(`${role}LanguageOther`);
    if (otherInput) {
        if (isChecked) {
            otherInput.style.display = 'block';
            otherInput.setAttribute('required', 'true');
        } else {
            otherInput.style.display = 'none';
            otherInput.removeAttribute('required');
        }
    }
}

// Validation Helpers
function validateDAEmail(email) {
    return email.toLowerCase().endsWith('@dakar-academy.org');
}

function validateEmail(email) {
    return email.includes('@') && email.includes('.');
}

// Helper: collect array of checked values
function getCheckedValues(checkboxName) {
    const checked = [];
    document.querySelectorAll(`input[name="${checkboxName}"]:checked`).forEach(chk => {
        checked.push(chk.value);
    });
    return checked;
}

// Tutor Submit Handler (Saves to Firebase Cloud)
document.getElementById('tutorForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const selectedDays = getCheckedValues('tutorDays');
    const selectedAgeGroups = getCheckedValues('tutorAgeGroup');
    const email = document.getElementById('tutorEmail').value;
    const errorSpan = document.getElementById('tutorEmailError');

    if (!validateDAEmail(email)) {
        if (errorSpan) errorSpan.style.display = 'block';
        return;
    }
    if (errorSpan) errorSpan.style.display = 'none';

    const selectedSubjects = getCheckedValues('tutorSubject');
    if (selectedSubjects.length === 0) {
        alert("Please select at least one field of expertise.");
        return;
    }

    const selectedSlots = getCheckedValues('tutorSlot');
    if (selectedSlots.length === 0) {
        alert("Please select at least one time slot availability.");
        return;
    }

    let selectedLangs = getCheckedValues('tutorLang');
    if (selectedLangs.includes('Other')) {
        selectedLangs = selectedLangs.filter(l => l !== 'Other');
        const customLang = document.getElementById('tutorLanguageOther').value.trim();
        if (customLang) selectedLangs.push(customLang);
    }

    if (selectedLangs.length === 0) {
        alert("Please select at least one language of fluency.");
        return;
    }

    const newTutor = {
        id: Date.now(),
        name: document.getElementById('tutorName').value,
        email: email,
        grade: parseInt(document.getElementById('tutorGrade').value),
        subjects: selectedSubjects,
        days: selectedDays,
        ageGroups: selectedAgeGroups,
        slots: selectedSlots,
        gender: document.getElementById('tutorGender').value,
        languages: selectedLangs
    };

    try {
        await window.dbTools.addDoc(window.dbTools.collection(window.db, "tutors"), newTutor);
        alert("Tutor registration completed successfully.");
        this.reset();
        const otherLang = document.getElementById('tutorLanguageOther');
        if (otherLang) otherLang.style.display = 'none';
    } catch (err) {
        console.error("Firebase Error:", err);
        alert("Error saving registration to cloud.");
    }
});

// Student/Parent Form Submit (Saves to Firebase Cloud)
document.getElementById('studentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Safely retrieve input elements
    const emailInput = document.getElementById('parentEmail') || document.getElementById('studentEmail');
    const email = emailInput ? emailInput.value.trim() : '';
    const errorSpan = document.getElementById('studentEmailError');

    if (!validateEmail(email)) {
        if (errorSpan) errorSpan.style.display = 'block';
        alert("Please enter a valid email address.");
        return;
    }
    if (errorSpan) errorSpan.style.display = 'none';

    const selectedSubjects = getCheckedValues('studentSubject');
    if (selectedSubjects.length === 0) {
        alert("Please select at least one subject your child needs help with.");
        return;
    }

    const selectedDays = getCheckedValues('studentDays');
    const selectedSlots = getCheckedValues('studentSlot');
    const preferredGrades = getCheckedValues('prefGrade').map(g => parseInt(g));

    let requiredLangs = getCheckedValues('prefLang');
    if (requiredLangs.includes('Other')) {
        requiredLangs = requiredLangs.filter(l => l !== 'Other');
        const customLang = document.getElementById('studentLanguageOther').value.trim();
        if (customLang) requiredLangs.push(customLang);
    }

    const newStudent = {
        id: Date.now(),
        parentName: document.getElementById('parentName') ? document.getElementById('parentName').value : 'Parent',
        studentName: document.getElementById('studentName') ? document.getElementById('studentName').value : 'Student',
        email: email,
        studentGrade: document.getElementById('studentGrade') ? document.getElementById('studentGrade').value : 'N/A',
        subjects: selectedSubjects,
        days: selectedDays,
        slots: selectedSlots,
        prefGender: document.getElementById('prefGender') ? document.getElementById('prefGender').value : 'No Preference',
        prefGrades: preferredGrades,
        prefLanguages: requiredLangs
    };

    try {
        await window.dbTools.addDoc(window.dbTools.collection(window.db, "students"), newStudent);
        alert("Request submitted successfully!");
        this.reset();
        const otherLang = document.getElementById('studentLanguageOther');
        if (otherLang) otherLang.style.display = 'none';
    } catch (err) {
        console.error("Firebase Error:", err);
        alert("Error saving request to cloud.");
    }
});

// Clear Database from Cloud
async function clearDatabase() {
    if (confirm("Confirm: This will delete all records of test students, tutors, and matches.")) {
        try {
            const tutorsSnap = await window.dbTools.getDocs(window.dbTools.collection(window.db, "tutors"));
            tutorsSnap.forEach(d => window.dbTools.deleteDoc(window.dbTools.doc(window.db, "tutors", d.id)));

            const studentsSnap = await window.dbTools.getDocs(window.dbTools.collection(window.db, "students"));
            studentsSnap.forEach(d => window.dbTools.deleteDoc(window.dbTools.doc(window.db, "students", d.id)));

            const matchesSnap = await window.dbTools.getDocs(window.dbTools.collection(window.db, "matches"));
            matchesSnap.forEach(d => window.dbTools.deleteDoc(window.dbTools.doc(window.db, "matches", d.id)));

            renderDashboard();
        } catch (err) {
            console.error("Firebase Clear Error:", err);
        }
    }
}

// Render Dashboard Screen
function renderDashboard() {
    const tutorCountElem = document.getElementById('tutorCount');
    const studentCountElem = document.getElementById('studentCount');
    
    if (tutorCountElem) tutorCountElem.textContent = tutors.length;
    if (studentCountElem) studentCountElem.textContent = students.length;

    const tList = document.getElementById('tutorList');
    const sList = document.getElementById('studentList');
    const mList = document.getElementById('matchesList');

    if (tList) tList.innerHTML = '';
    if (sList) sList.innerHTML = '';
    if (mList) mList.innerHTML = '';

    tutors.forEach(t => {
        const li = document.createElement('li');
        const daysStr = t.days && t.days.length > 0 ? t.days.join(', ') : 'Not specified';
        const slotsStr = t.slots && t.slots.length > 0 ? t.slots.join(', ') : 'Flexible';
        const langsStr = t.languages && t.languages.length > 0 ? t.languages.join(', ') : 'None specified';
        li.innerHTML = `<strong>${t.name}</strong> (Grade ${t.grade})<br>Subjects: ${t.subjects.join(', ')}<br>Days: ${daysStr} | Slots: ${slotsStr}<br>Languages: ${langsStr}`;
        if (tList) tList.appendChild(li);
    });

    students.forEach(s => {
        const li = document.createElement('li');
        const daysStr = s.days && s.days.length > 0 ? s.days.join(', ') : 'Not specified';
        const gradesStr = s.prefGrades && s.prefGrades.length > 0 ? `Grades: ${s.prefGrades.join(', ')}` : "No Grade Preference";
        const langsStr = s.prefLanguages && s.prefLanguages.length > 0 ? s.prefLanguages.join(', ') : "None specified";
        
        li.innerHTML = `<strong>${s.studentName}</strong> (Parent: ${s.parentName} - ${s.email})<br>Needs: ${s.subjects.join(', ')}<br>Days Needed: ${daysStr}<br>Prefs: Gender: ${s.prefGender} | ${gradesStr} | Languages: ${langsStr}`;
        if (sList) sList.appendChild(li);
    });

    if (mList) {
        if (matches.length === 0) {
            mList.innerHTML = '<li>No active matches compiled.</li>';
        } else {
            matches.forEach(m => {
                const li = document.createElement('li');
                li.innerHTML = `Connected: <strong>${m.tutor}</strong> (Grade ${m.tutorGrade || 'N/A'}) and <strong>${m.student}</strong><br>` +
                               `Contact: <strong>${m.studentEmail}</strong> & <strong>${m.tutorEmail}</strong><br>` +
                               `Matched Subject: <strong>${m.subject}</strong> | Day/Slot: <strong>${m.slot}</strong>`;
                mList.appendChild(li);
            });
        }
    }
}

// Multi-Criteria Matching Algorithm (Updates Cloud Records)
async function runMatchingAlgorithm() {
    let matchCount = 0;

    for (let i = students.length - 1; i >= 0; i--) {
        const student = students[i];

        let rankedTutors = tutors.map((tutor, index) => {
            let score = 0;

            // 1. Mandatory Subject Match
            const sharedSubjects = student.subjects.filter(sub => tutor.subjects && tutor.subjects.includes(sub));
            if (sharedSubjects.length === 0) return { index, score: 0 };
            score += sharedSubjects.length * 40;

            // 2. Mandatory Language Requirement
            const studentLangs = student.prefLanguages || [];
            const speaksAllLangs = studentLangs.every(lang => tutor.languages && tutor.languages.includes(lang));
            if (!speaksAllLangs) return { index, score: 0 };
            score += studentLangs.length * 15;

            // 3. Mandatory Gender Preference
            if (student.prefGender && student.prefGender !== 'No Preference' && tutor.gender !== student.prefGender) {
                return { index, score: 0 };
            }
            if (student.prefGender === tutor.gender) {
                score += 10;
            }

            // 4. Day Alignment
            let sharedDays = [];
            if (student.days && tutor.days) {
                sharedDays = student.days.filter(d => tutor.days.includes(d));
                score += sharedDays.length * 20;
            }

            // 5. Time Slot Alignment
            let sharedSlots = [];
            if (student.slots && tutor.slots) {
                sharedSlots = student.slots.filter(s => tutor.slots.includes(s));
                score += sharedSlots.length * 15;
            }

            // 6. Preferred Grade Level Match
            const prefGrades = student.prefGrades || [];
            if (prefGrades.length === 0 || prefGrades.includes(tutor.grade)) {
                score += 15;
            }

            // Format availability details
            let matchAvailability = 'Flexible';
            if (sharedDays.length > 0 && sharedSlots.length > 0) {
                matchAvailability = `${sharedDays.join('/')} during ${sharedSlots.join('/')}`;
            } else if (sharedDays.length > 0) {
                matchAvailability = sharedDays.join('/');
            } else if (sharedSlots.length > 0) {
                matchAvailability = sharedSlots.join('/');
            }

            return { 
                index, 
                score, 
                matchedSubject: sharedSubjects[0],
                matchedSlot: matchAvailability
            };
        });

        // Filter out non-matches and sort
        rankedTutors = rankedTutors.filter(item => item.score > 0);
        rankedTutors.sort((a, b) => b.score - a.score);

        if (rankedTutors.length > 0) {
            const bestMatch = rankedTutors[0];
            const pairedTutor = tutors[bestMatch.index];

            const newMatch = {
                student: student.studentName || student.name,
                studentEmail: student.email,
                tutor: pairedTutor.name,
                tutorGrade: pairedTutor.grade,
                tutorEmail: pairedTutor.email,
                subject: bestMatch.matchedSubject,
                slot: bestMatch.matchedSlot
            };

            // Save match to cloud
            await window.dbTools.addDoc(window.dbTools.collection(window.db, "matches"), newMatch);

            // Remove matched entries from cloud
            if (student.docId) await window.dbTools.deleteDoc(window.dbTools.doc(window.db, "students", student.docId));
            if (pairedTutor.docId) await window.dbTools.deleteDoc(window.dbTools.doc(window.db, "tutors", pairedTutor.docId));

            matchCount++;
        }
    }

    alert(`Matching complete! Formed ${matchCount} new connection(s).`);
}

// Run initial Firebase initialization on page load
window.addEventListener('load', function() {
    initFirebaseSync();
    if (isAdminUnlocked) renderDashboard();
});
