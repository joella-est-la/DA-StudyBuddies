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
    const selectedDays = getCheckedValues('tutorDays');
    const selectedAgeGroups = getCheckedValues('tutorAgeGroup');
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
        days: selectedDays,
        ageGroups: selectedAgeGroups,
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

// Student Form Submit
document.getElementById('studentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('studentEmail').value;
    const errorSpan = document.getElementById('studentEmailError');

    if(!validateEmail(email)) {
        errorSpan.style.display = 'block';
        return;
    }
    errorSpan.style.display = 'none';

    const selectedSubjects = getCheckedValues('studentSubject');
    if (selectedSubjects.length === 0) {
        alert("Please select at least one subject your child needs help with.");
        return;
    }

    const selectedDays = getCheckedValues('studentDays');
    const preferredGrades = getCheckedValues('prefGrade').map(g => parseInt(g));

    let requiredLangs = getCheckedValues('prefLang');
    if (requiredLangs.includes('Other')) {
        requiredLangs = requiredLangs.filter(l => l !== 'Other');
        const customLang = document.getElementById('studentLanguageOther').value.trim();
        if (customLang) requiredLangs.push(customLang);
    }

    const newStudent = {
        id: Date.now(),
        name: document.getElementById('studentName').value, // Child's Name
        email: email,                                       // Child's Email
        subjects: selectedSubjects,
        days: selectedDays,
        prefGender: document.getElementById('prefGender').value,
        prefGrades: preferredGrades,
        prefLanguages: requiredLangs
    };

    students.push(newStudent);
    saveData();
    alert("Request submitted successfully!");
    this.reset();
    document.getElementById('studentLanguageOther').style.display = 'none';
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
        const daysStr = t.days && t.days.length > 0 ? t.days.join(', ') : 'Not specified';
        li.innerHTML = `<strong>${t.name}</strong> (Grade ${t.grade})<br>Subjects: ${t.subjects.join(', ')}<br>Days: ${daysStr} | Languages: ${t.languages.join(', ')}`;
        tList.appendChild(li);
    });

    students.forEach(s => {
        const li = document.createElement('li');
        const daysStr = s.days && s.days.length > 0 ? s.days.join(', ') : 'Not specified';
        const gradesStr = s.prefGrades.length > 0 ? `Grades: ${s.prefGrades.join(', ')}` : "No Grade Preference";
        li.innerHTML = `<strong>${s.name}</strong> (${s.email})<br>Needs: ${s.subjects.join(', ')}<br>Days Needed: ${daysStr}<br>Prefs: Gender: ${s.prefGender} | ${gradesStr}`;
        sList.appendChild(li);
    });

    if(matches.length === 0) {
        mList.innerHTML = '<li>No active matches compiled.</li>';
    } else {
        matches.forEach(m => {
            const li = document.createElement('li');
            li.innerHTML = `Connected: <strong>${m.tutor}</strong> (Grade ${m.tutorGrade || 'N/A'}) and <strong>${m.student}</strong><br>` +
                           `Contact: <strong>${m.studentEmail}</strong> & <strong>${m.tutorEmail}</strong><br>` +
                           `Matched Subject: <strong>${m.subject}</strong> | Matched Day(s): <strong>${m.slot}</strong>`;
            mList.appendChild(li);
        });
    }
}

// Multi-Criteria Matching Algorithm
function runMatchingAlgorithm() {
    let matchCount = 0;
    
    for (let i = students.length - 1; i >= 0; i--) {
        const student = students[i];

        let rankedTutors = tutors.map((tutor, index) => {
            let score = 0;

            // 1. Subject Match
            const sharedSubjects = student.subjects.filter(sub => tutor.subjects.includes(sub));
            if (sharedSubjects.length === 0) return { index, score: 0 };
            score += sharedSubjects.length * 40;

            // 2. Day Alignment
            let sharedDays = [];
            if (student.days && tutor.days) {
                sharedDays = student.days.filter(d => tutor.days.includes(d));
                if (sharedDays.length > 0) {
                    score += sharedDays.length * 20;
                }
            }

            // 3. Language Match
            const sharedLangs = student.prefLanguages.filter(l => tutor.languages.includes(l));
            score += sharedLangs.length * 15;

            // 4. Preferred Grade Level Match
            if (student.prefGrades.length === 0 || student.prefGrades.includes(tutor.grade)) {
                score += 15;
            }

            // 5. Gender Preference Match
            if (student.prefGender === 'No Preference' || tutor.gender === student.prefGender) {
                score += 10;
            }

            return { 
                index, 
                score, 
                matchedSubject: sharedSubjects[0],
                matchedSlot: sharedDays.length > 0 ? sharedDays.join(', ') : 'Flexible / To be agreed'
            };
        });

        rankedTutors = rankedTutors.filter(item => item.score > 0);
        rankedTutors.sort((a, b) => b.score - a.score);

        if (rankedTutors.length > 0) {
            const bestMatch = rankedTutors[0];
            const pairedTutor = tutors[bestMatch.index];

            matches.push({
                student: student.name,
                studentEmail: student.email,
                tutor: pairedTutor.name,
                tutorGrade: pairedTutor.grade,
                tutorEmail: pairedTutor.email,
                subject: bestMatch.matchedSubject,
                slot: bestMatch.matchedSlot
            });

            students.splice(i, 1);
            tutors.splice(bestMatch.index, 1);
            matchCount++;
        }
    }

    saveData();
    renderDashboard();
    alert(`Matching complete! Formed ${matchCount} new connection(s).`);
}

// Run initial rendering check
window.onload = function() {
    if (isAdminUnlocked) renderDashboard();
};
