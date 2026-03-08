import { db } from "./firebase-config.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const coursesGrid = document.getElementById('courses-grid');

// Sample initial data if DB is empty
const defaultCourses = {
    "course_1": {
        id: "course_1",
        title: "Full-Stack Web Development BootCamp",
        category: "Programming",
        description: "Master HTML, CSS, React, Node.js, and Databases in this comprehensive 12-week intensive course designed to take you from beginner to professional.",
        duration: "12 Weeks",
        price: "299",
        iconClass: "fa-solid fa-code"
    },
    "course_2": {
        id: "course_2",
        title: "UI/UX Design Masterclass",
        category: "Design",
        description: "Learn fundamental design principles, Figma, prototyping, and user testing. Create stunning web and mobile interfaces that wow users.",
        duration: "8 Weeks",
        price: "199",
        iconClass: "fa-solid fa-pen-nib"
    },
    "course_3": {
        id: "course_3",
        title: "Data Science & Machine Learning",
        category: "Data",
        description: "Dive deep into Python, Pandas, Scikit-Learn. Build predictive models and learn to manipulate large datasets seamlessly.",
        duration: "10 Weeks",
        price: "349",
        iconClass: "fa-solid fa-chart-line"
    }
};

async function loadCourses() {
    if (!coursesGrid) return; // Only run on pages with the grid
    
    try {
        const coursesRef = ref(db, 'courses');
        const snapshot = await get(coursesRef);
        
        if (snapshot.exists()) {
            renderCourses(snapshot.val());
        } else {
            // Seed the database if empty
            console.log("No courses found. Seeding default courses...");
            await set(coursesRef, defaultCourses);
            renderCourses(defaultCourses);
        }
    } catch (error) {
        console.error("Error fetching courses:", error);
        if (error.code && error.code.includes('permission-denied')) {
            coursesGrid.innerHTML = `
                <div class="alert alert-error text-center" style="grid-column: 1/-1;">
                    <i class="fa-solid fa-triangle-exclamation"></i> 
                    Firebase rules currently restricting access, or config is missing. Please check your Realtime DB setup.
                </div>
            `;
        } else {
            coursesGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">Failed to load courses. Check console logs.</p>`;
        }
    }
}

function renderCourses(coursesObj) {
    if (!coursesGrid) return;
    coursesGrid.innerHTML = '';
    
    const courses = Object.values(coursesObj);
    
    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <div class="course-img-placeholder">
                <i class="${course.iconClass || 'fa-solid fa-book'}"></i>
            </div>
            <div class="course-content">
                <span class="course-badge">${course.category}</span>
                <h3>${course.title}</h3>
                <p>${course.description.substring(0, 100)}...</p>
                <div class="course-meta">
                    <span><i class="fa-regular fa-clock"></i> ${course.duration}</span>
                    <span class="course-price">$${course.price}</span>
                </div>
                <a href="course.html?id=${course.id}" class="btn btn-outline btn-block mt-auto">View Details</a>
            </div>
        `;
        coursesGrid.appendChild(card);
    });
}

// Init when script loads
loadCourses();
