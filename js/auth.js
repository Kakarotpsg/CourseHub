import { auth, db } from "./firebase-config.js";
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut,
    updateProfile 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// UI Elements (Handling both auth page and global nav)
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const toggleModeBtn = document.getElementById('toggle-mode-btn');
const toggleText = document.getElementById('toggle-text');
const nameGroup = document.getElementById('name-group');
const submitBtn = document.getElementById('submit-btn');
const submitSpinner = document.getElementById('submit-spinner');
const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
const alertContainer = document.getElementById('alert-container');
const authNavSection = document.getElementById('auth-nav-section');

// State
let isRegistering = false;

// Check URL params for register mode
if (window.location.search.includes('mode=register')) {
    toggleMode();
}

if (toggleModeBtn) {
    toggleModeBtn.addEventListener('click', toggleMode);
}

function toggleMode() {
    isRegistering = !isRegistering;
    
    if (isRegistering) {
        authTitle.textContent = "Create an Account";
        authSubtitle.textContent = "Join us to access premium courses.";
        nameGroup.style.display = "block";
        if(btnText) btnText.textContent = "Sign Up";
        toggleText.innerHTML = `Already have an account? <button type="button" class="btn-link" id="toggle-mode-btn">Sign in</button>`;
    } else {
        authTitle.textContent = "Welcome Back";
        authSubtitle.textContent = "Please enter your details to sign in.";
        nameGroup.style.display = "none";
        if(btnText) btnText.textContent = "Sign In";
        toggleText.innerHTML = `Don't have an account? <button type="button" class="btn-link" id="toggle-mode-btn">Sign up</button>`;
    }
    
    // Reattach listener to new button
    document.getElementById('toggle-mode-btn').addEventListener('click', toggleMode);
}

// Enable button when fields are filled (on auth page)
if (authForm) {
    authForm.addEventListener('input', () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        let isValid = email.length > 0 && password.length >= 6;
        
        if (isRegistering) {
            const name = document.getElementById('fullName').value;
            isValid = isValid && name.length > 0;
        }
        
        submitBtn.disabled = !isValid;
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Show loading state
        submitBtn.disabled = true;
        btnText.textContent = "Processing...";
        submitSpinner.classList.remove('hidden');
        showAlert('', 'hidden'); // hide previous alerts
        
        try {
            if (isRegistering) {
                const name = document.getElementById('fullName').value;
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                
                // Update profile with name
                await updateProfile(userCredential.user, { displayName: name });
                
                // Save additional user info to Realtime DB
                await set(ref(db, 'users/' + userCredential.user.uid), {
                    name: name,
                    email: email,
                    createdAt: Date.now()
                });
                
                window.location.href = "index.html"; // Redirect to home
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = "index.html"; // Redirect home on sign-in
            }
        } catch (error) {
            console.error("Auth Error", error);
            showAlert(getErrorMessage(error.code), 'alert-error');
            
            // Reset button
            submitBtn.disabled = false;
            btnText.textContent = isRegistering ? "Sign Up" : "Sign In";
            submitSpinner.classList.add('hidden');
        }
    });
}

function showAlert(message, type) {
    if (!alertContainer) return;
    
    if (type === 'hidden') {
        alertContainer.classList.add('hidden');
        return;
    }
    
    alertContainer.className = `alert ${type}`;
    alertContainer.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;
}

function getErrorMessage(code) {
    switch(code) {
        case 'auth/email-already-in-use': return "This email is already registered.";
        case 'auth/invalid-credential': return "Invalid email or password.";
        case 'auth/weak-password': return "Password should be at least 6 characters.";
        default: return "Error code: " + code;
    }
}

// Global Auth State Observer (for navbar)
onAuthStateChanged(auth, (user) => {
    // If not on the auth page itself, update navigation UI dynamically
    if (authNavSection) {
        if (user) {
            const name = user.displayName || user.email.split('@')[0];
            const initial = name.charAt(0).toUpperCase();
            
            authNavSection.innerHTML = `
                <div class="user-profile-nav">
                    <span>Hello, <strong>${name}</strong></span>
                    <div class="user-avatar">${initial}</div>
                    <button class="btn btn-outline btn-sm" id="logout-btn">Log out</button>
                </div>
            `;
            
            document.getElementById('logout-btn').addEventListener('click', () => {
                signOut(auth).then(() => {
                    window.location.reload();
                });
            });
            
        } else {
            // Unauthenticated state
            authNavSection.innerHTML = `
                <a href="auth.html" class="btn btn-outline" id="login-btn">Login</a>
                <a href="auth.html?mode=register" class="btn btn-primary" id="register-btn">Sign Up</a>
            `;
        }
    }
    
    // Expose user to the global scope for other scripts to check
    window.currentUser = user;
    
    // Dispatch a custom event so other scripts know auth state has loaded
    document.dispatchEvent(new CustomEvent('authStateChanged', { detail: user }));
});
