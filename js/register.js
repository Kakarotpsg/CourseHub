import { db } from "./firebase-config.js";
import { ref, get, push, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// Elements
const loadingContainer = document.getElementById('loading-container');
const errorContainer = document.getElementById('error-container');
const courseContent = document.getElementById('course-content');
const authRequiredBlock = document.getElementById('auth-required-block');
const registrationForm = document.getElementById('registration-form');
const successBlock = document.getElementById('success-block');

let currentCourseId = null;
let currentCourseData = null;

// Get course ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('id');

if (courseId) {
    currentCourseId = courseId;
    loadCourseDetails(courseId);
} else {
    showError("No course specified.");
}

async function loadCourseDetails(id) {
    if (!loadingContainer) return; // Not on the course page
    
    try {
        const courseRef = ref(db, 'courses/' + id);
        const snapshot = await get(courseRef);
        
        loadingContainer.classList.add('hidden');
        
        if (snapshot.exists()) {
            currentCourseData = snapshot.val();
            populateCourseUI(currentCourseData);
        } else {
            showError("Course not found in database.");
        }
    } catch (error) {
        console.error("Error fetching course details:", error);
        loadingContainer.classList.add('hidden');
        showError("Failed to fetch course data. DB rules or config error.");
    }
}

function populateCourseUI(course) {
    document.getElementById('course-title').textContent = course.title;
    document.getElementById('course-description').textContent = course.description;
    document.getElementById('course-category').textContent = course.category;
    document.getElementById('course-duration').textContent = course.duration;
    document.getElementById('course-price').textContent = '$' + course.price;
    document.getElementById('summary-price').textContent = '$' + course.price;
    
    courseContent.classList.remove('hidden');
}

function showError(message) {
    errorContainer.classList.remove('hidden');
    document.getElementById('error-message').textContent = message;
    if(loadingContainer) loadingContainer.classList.add('hidden');
}

// Handle Authentication State for the Registration Form
document.addEventListener('authStateChanged', (e) => {
    const user = e.detail;
    
    if (user) {
        // Logged in
        authRequiredBlock.classList.add('hidden');
        registrationForm.classList.remove('hidden');
        
        // Auto-fill available details
        const regName = document.getElementById('regName');
        if(regName && !regName.value) {
            regName.value = user.displayName || '';
        }
    } else {
        // Not logged in
        authRequiredBlock.classList.remove('hidden');
        registrationForm.classList.add('hidden');
        successBlock.classList.add('hidden');
    }
});

// Handle Enrollment Submission
if (registrationForm) {
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = window.currentUser;
        if (!user) return; // Double check auth
        
        const enrollBtn = document.getElementById('enroll-btn');
        const enrollSpinner = document.getElementById('enroll-spinner');
        const regAlert = document.getElementById('reg-alert');
        
        const name = document.getElementById('regName').value;
        const phone = document.getElementById('regPhone').value;
        const motivation = document.getElementById('regMotivation').value;
        
        enrollBtn.disabled = true;
        enrollSpinner.classList.remove('hidden');
        regAlert.classList.add('hidden');
        
        try {
            // Save registration record in Realtime Database under 'registrations'
            const registrationsRef = ref(db, 'registrations');
            const newRegRef = push(registrationsRef);
            
            await set(newRegRef, {
                userId: user.uid,
                userEmail: user.email,
                name: name,
                phone: phone,
                motivation: motivation,
                courseId: currentCourseId,
                courseName: currentCourseData.title,
                pricePaid: currentCourseData.price,
                status: 'confirmed',
                timestamp: Date.now()
            });
            
            // Show success UI
            registrationForm.classList.add('hidden');
            successBlock.classList.remove('hidden');
            
        } catch (error) {
            console.error("Enrollment error:", error);
            regAlert.className = 'alert alert-error';
            regAlert.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Registration failed: Database write error`;
            regAlert.classList.remove('hidden');
            
            enrollBtn.disabled = false;
            enrollSpinner.classList.add('hidden');
        }
    });
}
