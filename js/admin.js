import { db } from "./firebase-config.js";
import { ref, get, set, remove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// -- Admin Credentials (Hardcoded as requested)
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";

// -- Elements
const loginSection = document.getElementById('admin-login-section');
const dashSection = document.getElementById('admin-dashboard-section');
const loginForm = document.getElementById('admin-login-form');
const adminAlert = document.getElementById('admin-alert');

const tbody = document.getElementById('admin-courses-tbody');
const modal = document.getElementById('course-modal');
const courseForm = document.getElementById('course-form');
const modalTitle = document.getElementById('modal-title');
const modalAlert = document.getElementById('modal-alert');
const saveSpinner = document.getElementById('save-spinner');

// -- Authentication Logic
function checkAuth() {
    if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
        loginSection.classList.add('hidden');
        dashSection.classList.remove('hidden');
        loadCourses();
    } else {
        loginSection.classList.remove('hidden');
        dashSection.classList.add('hidden');
    }
}

// Initial Check
checkAuth();

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = document.getElementById('adminUsername').value;
        const p = document.getElementById('adminPassword').value;

        if (u === ADMIN_USER && p === ADMIN_PASS) {
            sessionStorage.setItem('isAdminLoggedIn', 'true');
            checkAuth();
        } else {
            adminAlert.textContent = "Invalid admin credentials.";
            adminAlert.classList.remove('hidden');
            adminAlert.classList.add('alert-error');
        }
    });
}

document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
    sessionStorage.removeItem('isAdminLoggedIn');
    checkAuth();
});


// -- CRUD Operations (Courses)

// READ
async function loadCourses() {
    try {
        const coursesRef = ref(db, 'courses');
        const snapshot = await get(coursesRef);
        
        tbody.innerHTML = '';
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            // Store raw objects to be able to edit them easily
            window.coursesData = data; 
            
            Object.values(data).forEach(course => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="text-muted text-sm">${course.id}</td>
                    <td><strong>${course.title}</strong></td>
                    <td><span class="course-badge" style="margin:0">${course.category}</span></td>
                    <td>$${course.price}</td>
                    <td>${course.duration}</td>
                    <td class="action-btns">
                        <button class="btn btn-outline btn-sm edit-btn" data-id="${course.id}"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-outline btn-sm text-error delete-btn" data-id="${course.id}"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            attachRowListeners();
        } else {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center">No courses found in database.</td></tr>`;
        }
    } catch (error) {
        console.error("Error fetching courses:", error);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-error">Failed to load from Firebase.</td></tr>`;
    }
}

// Attach Listeners to dynamic Edit/Delete buttons
function attachRowListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openModal(e.currentTarget.dataset.id));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteCourse(e.currentTarget.dataset.id));
    });
}

// Open Form (Create or Update)
function openModal(courseId = null) {
    courseForm.reset();
    modalAlert.classList.add('hidden');
    
    if (courseId && window.coursesData[courseId]) {
        // Edit Mode
        modalTitle.textContent = "Edit Course";
        const c = window.coursesData[courseId];
        document.getElementById('courseId').value = c.id;
        document.getElementById('courseTitle').value = c.title || '';
        document.getElementById('courseCategory').value = c.category || '';
        document.getElementById('coursePrice').value = c.price || '';
        document.getElementById('courseDuration').value = c.duration || '';
        document.getElementById('courseIcon').value = c.iconClass || '';
        document.getElementById('courseDesc').value = c.description || '';
    } else {
        // Create Mode
        modalTitle.textContent = "Add New Course";
        // Convert title to a slug ID if it's new
        document.getElementById('courseId').value = `course_${Date.now()}`;
    }
    
    modal.classList.remove('hidden');
}

document.getElementById('add-course-btn')?.addEventListener('click', () => openModal());
document.getElementById('close-modal-btn')?.addEventListener('click', () => modal.classList.add('hidden'));

// CREATE / UPDATE Submission
if (courseForm) {
    courseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveSpinner.classList.remove('hidden');
        document.getElementById('save-course-btn').disabled = true;
        
        const cId = document.getElementById('courseId').value;
        const newCourse = {
            id: cId,
            title: document.getElementById('courseTitle').value,
            category: document.getElementById('courseCategory').value,
            price: document.getElementById('coursePrice').value,
            duration: document.getElementById('courseDuration').value,
            iconClass: document.getElementById('courseIcon').value,
            description: document.getElementById('courseDesc').value
        };
        
        try {
            await set(ref(db, `courses/${cId}`), newCourse);
            modal.classList.add('hidden');
            loadCourses(); // Refresh table
        } catch (error) {
            console.error("Save Error", error);
            modalAlert.textContent = "Failed to save course to database: " + error.message;
            modalAlert.classList.remove('hidden');
            modalAlert.classList.add('alert-error');
        } finally {
            saveSpinner.classList.add('hidden');
            document.getElementById('save-course-btn').disabled = false;
        }
    });
}

// DELETE
async function deleteCourse(courseId) {
    if (confirm(`Are you sure you want to delete course ID '${courseId}'? This cannot be undone.`)) {
        try {
            await remove(ref(db, `courses/${courseId}`));
            loadCourses(); // Refresh table
        } catch (error) {
            console.error("Delete Error", error);
            alert("Failed to delete course.");
        }
    }
}
