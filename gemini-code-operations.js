// Local Database Retrieval
let tutors = JSON.parse(localStorage.getItem('da_tutors_v2')) || [];
let students = JSON.parse(localStorage.getItem('da_students_v2')) || [];
let matches = JSON.parse(localStorage.getItem('da_matches_v2')) || [];

// Simple State Tracking for Admin Auth
let isAdminUnlocked = false;

// Navigation engine
function switchTab(tabId) {
    // If trying to access admin dashboard but it's locked, show auth screen
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

    // Password is set to "DA-admin-2026"
    if (enteredPass === 'DA-admin-2026') {
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

// Domain verification helper
function validateEmail(email) {
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

    if(!validateEmail(email)) {
        errorSpan.style.display = 'block';
        return;
    }
    errorSpan.style.display = 'none';

    // Parse languages (and handle specified "Other" language if checked)
    let selectedLangs = getCheckedValues('tutorLang');
    if (selectedLangs.includes('Other')) {
        // Remove "Other" placeholder and push custom input value
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
        subject: document.getElementById('tutorSubject').value,
        gender: document.getElementById('tutorGender').value,
        languages: selectedLangs
    };

    tutors.push(newTutor);
    saveData();
    alert("Tutor registration completed successfully.");
    this.reset();
    document.getElementById('tutorLanguageOther').style.display = 'none';
});

// Student Form Submit Handler
document.getElementById('studentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('studentEmail').value;
    const errorSpan = document.getElementById('studentEmailError');

    if(!validateEmail(email)) {
        errorSpan.style.display = 'block';
        return;
    }
    errorSpan.style.display = 'none';

    // Parse preferred grades
    const preferredGrades = getCheckedValues('prefGrade').map(g => parseInt(g));

    // Parse required languages
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

    const newStudent = {
        id: Date.now(),
        name: document.getElementById('studentName').value,
        email: email,
        subject: document.getElementById('studentSubject').value,
        prefGender: document.getElementById('prefGender').value,
        prefGrades: preferredGrades, // Empty array means "No Preference"
        prefLanguages: requiredLangs
    };

    students.push(newStudent);
    saveData();
    alert("Request submitted successfully.");
    this.reset();
    document.getElementById('studentLanguageOther').style.display = 'none';
});

function saveData() {
    localStorage.setItem('da_tutors_v2', JSON.stringify(tutors));
    localStorage.setItem('da_students_v2', JSON.stringify(students));
    localStorage.setItem('da_matches_v2', JSON.stringify(matches));
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
        li.innerHTML = `<strong>${t.name}</strong> (Grade ${t.grade})<br>Subject: ${t.subject} | Gender: ${t.gender}<br>Languages: ${t.languages.join(', ')}`;
        tList.appendChild(li);
    });

    students.forEach(s => {
        const li = document.createElement('li');
        const gradesStr = s.prefGrades.length > 0 ? `Grades: ${s.prefGrades.join(', ')}` : "No Grade Preference";
        li.innerHTML = `<strong>${s.name}</strong><br>Needs: ${s.subject}<br>Preferences: Gender: ${s.prefGender} | ${gradesStr} | Languages: ${s.prefLanguages.join(', ')}`;
        sList.appendChild(li);
    });

    if(matches.length === 0) {
        mList.innerHTML = '<li>No active matches compiled.</li>';
    } else {
        matches.forEach(m => {
            const li = document.createElement('li');
            li.innerHTML = `Connected: <strong>${m.tutor}</strong> and <strong>${m.student}</strong><br>Subject: ${m.subject} | Emails: ${m.tutorEmail} & ${m.studentEmail}`;
            mList.appendChild(li);
        });
    }
}

// Multi-Criteria Matching Algorithm
function runMatchingAlgorithm() {
    let matchCount = 0;

    for (let i = students.length - 1; i >= 0; i--) {
        const student = students[i];

        const matchIndex = tutors.findIndex(tutor => {
            // Rule 1: Subject matches
            if (tutor.subject !== student.subject) return false;

            // Rule 2: Gender Preference check
            if (student.prefGender !== 'No Preference' && tutor.gender !== student.prefGender) return false;

            // Rule 3: Multi-Grade Preference check
            if (student.prefGrades.length > 0 && !student.prefGrades.includes(tutor.grade)) return false;

            // Rule 4: Multi-Language Preference check
            // The tutor MUST be fluent in ALL the languages required by the parent request
            const tutorFluentInAll = student.prefLanguages.every(lang => tutor.languages.includes(lang));
            if (!tutorFluentInAll) return false;

            return true;
        });

        if (matchIndex !== -1) {
            const pairedTutor = tutors[matchIndex];

            matches.push({
                student: student.name,
                studentEmail: student.email,
                tutor: pairedTutor.name,
                tutorEmail: pairedTutor.email,
                subject: student.subject
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