// Local Database Retrieval
let tutors = JSON.parse(localStorage.getItem('da_tutors_v3')) || [];
let students = JSON.parse(localStorage.getItem('da_students_v3')) || [];
let matches = JSON.parse(localStorage.getItem('da_matches_v3')) || [];

// Simple State Tracking for Admin Auth
let isAdminUnlocked = false;

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
    event.target.classList.add('active');
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
    if (isChecked) {
        otherInput.style.display = 'block';
        otherInput.setAttribute('required', 'true');
    } else {
        otherInput.style.display = 'none';
        otherInput.removeAttribute('required');
    }
}

// DA Email Domain verification helper for tutors
function validateDAEmail(email) {
    return email.toLowerCase().endsWith('@dakar-academy.org');
}

// Helper: collect array of checked values
function getCheckedValues(checkboxName) {
    const checked = [];
    document.querySelectorAll(`input[name="${checkboxName}"]:checked`).forEach(chk => {
        checked.push(chk.value);
    });
    return checked;
}

// Tutor Submit Handler
document.getElementById('tutorForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('tutorEmail').value;
    const errorSpan = document.getElementById('tutorEmailError');

    if(!validateDAEmail(email)) {
        errorSpan.style.display = 'block';
        return;
    }
    errorSpan.style.display = 'none';

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
        slots: selectedSlots,
        gender: document.getElementById('tutorGender').value,
        languages: selectedLangs
    };

    tutors.push(newTutor);
    saveData();
    alert("Tutor registration completed successfully.");
    this.reset();
    document.getElementById('tutorLanguageOther').style.display = 'none';
});

// Parent/Student Form Submit Handler
// Parent/Student Form Submit Handler
document.getElementById('studentForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const selectedSubjects = getCheckedValues('studentSubject');
    if (selectedSubjects.length === 0) {
        alert("Please select at least one subject needed.");
        return;
    }

    const selectedSlots = getCheckedValues('studentSlot');
    if (selectedSlots.length === 0) {
        alert("Please select at least one preferred time slot.");
        return;
    }

    const preferredGrades = getCheckedValues('prefGrade').map(g => parseInt(g));

    let requiredLangs = getCheckedValues('prefLang');
    if (requiredLangs.includes('Other')) {
        requiredLangs = requiredLangs.filter(l => l !== 'Other');
        const customLang = document.getElementById('studentLanguageOther').value.trim();
        if (customLang) requiredLangs.push(customLang);
    }

    if (requiredLangs.length === 0) {
        alert("Please select at least one required language preference.");
        return;
    }

    const newStudentRequest = {
        id: Date.now(),
        parentName: document.getElementById('parentName').value,
        parentEmail: document.getElementById('parentEmail').value,
        studentName: document.getElementById('studentName').value,
        studentGrade: document.getElementById('studentGrade').value,
        subjects: selectedSubjects,
        slots: selectedSlots,
        prefGender: document.getElementById('prefGender').value,
        prefGrades: preferredGrades,
        prefLanguages: requiredLangs
    };

    students.push(newStudentRequest);
    saveData();

    alert("Parent request submitted successfully.");
    this.reset();
    
    const otherLangInput = document.getElementById('studentLanguageOther');
    if (otherLangInput) {
        otherLangInput.style.display = 'none';
        otherLangInput.removeAttribute('required');
    }
});
function saveData() {
    localStorage.setItem('da_tutors_v3', JSON.stringify(tutors));
    localStorage.setItem('da_students_v3', JSON.stringify(students));
    localStorage.setItem('da_matches_v3', JSON.stringify(matches));
}

function clearDatabase() {
    if(confirm("Confirm: This will delete all records of test students, tutors, and matches.")) {
        localStorage.clear();
        tutors = [];
        students = [];
        matches = [];
        renderDashboard();
    }
}

// Render Dashboard Screen
function renderDashboard() {
    document.getElementById('tutorCount').textContent = tutors.length;
    document.getElementById('studentCount').textContent = students.length;

    const tList = document.getElementById('tutorList');
    const sList = document.getElementById('studentList');
    const mList = document.getElementById('matchesList');

    tList.innerHTML = '';
    sList.innerHTML = '';
    mList.innerHTML = '';

    tutors.forEach(t => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${t.name}</strong> (Grade ${t.grade})<br>Subjects: ${t.subjects.join(', ')}<br>Slots: ${t.slots.join(', ')}<br>Gender: ${t.gender} | Languages: ${t.languages.join(', ')}`;
        tList.appendChild(li);
    });

    students.forEach(s => {
        const li = document.createElement('li');
        const gradesStr = s.prefGrades.length > 0 ? `Grades: ${s.prefGrades.join(', ')}` : "No Grade Preference";
        li.innerHTML = `<strong>Child: ${s.studentName}</strong> (Grade ${s.studentGrade})<br>Parent: ${s.parentName} (${s.parentEmail})<br>Subject Needed: ${s.subject}<br>Slots: ${s.slots.join(', ')}<br>Preferences: Gender: ${s.prefGender} | ${gradesStr} | Languages: ${s.prefLanguages.join(', ')}`;
        sList.appendChild(li);
    });

    if(matches.length === 0) {
        mList.innerHTML = '<li>No active matches compiled.</li>';
    } else {
        matches.forEach(m => {
            const li = document.createElement('li');
            li.innerHTML = `Connected: <strong>${m.tutor}</strong> and <strong>${m.student}</strong> (Grade ${m.studentGrade})<br>Parent Contact: ${m.parentName} (${m.parentEmail})<br>Subject: ${m.subject} | Matched Slot: ${m.slot}`;
            mList.appendChild(li);
        });
    }
}

// Multi-Criteria Matching Algorithm with Slot & Multi-Subject Checking
function runMatchingAlgorithm() {
    let matchCount = 0;

    for (let i = students.length - 1; i >= 0; i--) {
        const student = students[i];

        const matchIndex = tutors.findIndex(tutor => {
            // Rule 1: Subject area overlap
            if (!tutor.subjects.includes(student.subject)) return false;

            // Rule 2: Overlapping time slot availability
            const sharedSlot = student.slots.find(slot => tutor.slots.includes(slot));
            if (!sharedSlot) return false;

            // Rule 3: Gender Preference check
            if (student.prefGender !== 'No Preference' && tutor.gender !== student.prefGender) return false;

            // Rule 4: Grade Preference check
            if (student.prefGrades.length > 0 && !student.prefGrades.includes(tutor.grade)) return false;

            // Rule 5: Language check
            const tutorFluentInAll = student.prefLanguages.every(lang => tutor.languages.includes(lang));
            if (!tutorFluentInAll) return false;

            return true;
        });

        if (matchIndex !== -1) {
            const pairedTutor = tutors[matchIndex];
            const matchedSlot = student.slots.find(slot => pairedTutor.slots.includes(slot));

            matches.push({
                student: student.studentName,
                studentGrade: student.studentGrade,
                parentName: student.parentName,
                parentEmail: student.parentEmail,
                tutor: pairedTutor.name,
                tutorEmail: pairedTutor.email,
                subject: student.subject,
                slot: matchedSlot
            });

            students.splice(i, 1);
            tutors.splice(matchIndex, 1);
            matchCount++;
        }
    }

    saveData();
    renderDashboard();
    alert(`Matching run finished. Formed ${matchCount} connection(s).`);
}

// Run initial rendering check
window.onload = function() {
    if (isAdminUnlocked) renderDashboard();
};
