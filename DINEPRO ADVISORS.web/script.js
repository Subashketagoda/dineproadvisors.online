// Premium Preloader Logic
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('fade-out');
        }, 1000); // 1 second delay for minimum visibility
    }
});

// Visitor Tracking with Firebase Sync for Daily Analytics Chart

function trackVisitor() {
    if (typeof window.firebaseDB === 'undefined' || typeof window.firebaseOnValue === 'undefined') {
        window.addEventListener('firebaseLoaded', trackVisitor);
        return;
    }

    const statsRef = window.firebaseRef(window.firebaseDB, 'dinepro/stats');
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const lastVisitKey = 'dinepro_last_visit_time';
    const now = Date.now();
    const ONE_HOUR = 3600000;

    // Check if it's been more than an hour since the last recorded visit
    const lastVisit = localStorage.getItem(lastVisitKey);
    if (!lastVisit || (now - parseInt(lastVisit)) > ONE_HOUR) {
        window.firebaseOnValue(statsRef, (snapshot) => {
            let stats = snapshot.val() || { visits: 0, dailyVisits: {} };
            if (!stats.dailyVisits) stats.dailyVisits = {};

            stats.visits = (stats.visits || 0) + 1;
            stats.dailyVisits[todayStr] = (stats.dailyVisits[todayStr] || 0) + 1;

            window.firebaseSet(statsRef, stats);
            localStorage.setItem(lastVisitKey, now.toString());
            localStorage.setItem('dinepro_visits', stats.visits);
        }, { onlyOnce: true });
    }
}
trackVisitor();

// Sticky Header Effect
window.addEventListener('scroll', function () {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.padding = '8px 0';
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.borderBottom = '1px solid rgba(93, 58, 26, 0.1)';
        header.style.backdropFilter = 'blur(15px)';
    } else {
        header.style.padding = '15px 0';
        header.style.background = 'transparent';
        header.style.borderBottom = '1px solid transparent';
    }
});

// Chat Window Toggle
const chatToggle = document.getElementById('chatToggle');
const chatWindow = document.getElementById('chatWindow');
const closeChat = document.getElementById('closeChat');
const chatHome = document.getElementById('chatHome');
const chatMessagesView = document.getElementById('chatMessagesView');
const startChat = document.getElementById('startChat');
const goHome = document.getElementById('goHome');
const goChat = document.getElementById('goChat');
const messagesContainer = document.getElementById('messagesContainer');
const chatInput = document.getElementById('chatInput');
const sendMessage = document.getElementById('sendMessage');

if (chatToggle && chatWindow) {
    chatToggle.addEventListener('click', function (e) {
        e.preventDefault();
        const isHidden = window.getComputedStyle(chatWindow).display === 'none';
        if (isHidden) {
            chatWindow.style.setProperty('display', 'flex', 'important');
            // Hide badge
            const badge = this.querySelector('.badge');
            if (badge) badge.style.display = 'none';
        } else {
            chatWindow.style.setProperty('display', 'none', 'important');
        }
    });
}

if (closeChat) {
    closeChat.addEventListener('click', (e) => {
        e.stopPropagation();
        chatWindow.style.setProperty('display', 'none', 'important');
    });
}

// Switch between Home and Chat View
function showHome() {
    chatHome.style.display = 'block';
    chatMessagesView.style.display = 'none';
    goHome.classList.add('active');
    goChat.classList.remove('active');
}

function showChat() {
    chatHome.style.display = 'none';
    chatMessagesView.style.display = 'flex';
    goHome.classList.remove('active');
    goChat.classList.add('active');

    // Initial bot message if empty
    if (messagesContainer.children.length === 0) {
        addMessage('Hello! How can I help you today?', 'bot');
    }
}

if (startChat) startChat.addEventListener('click', showChat);
if (goHome) goHome.addEventListener('click', showHome);
if (goChat) goChat.addEventListener('click', showChat);

// Message Handling
function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.innerText = text;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// --- GLOBAL GEMINI SYNC ---
let globalGeminiKey = localStorage.getItem('dinepro_gemini_key') || "";
function syncGlobalGemini() {
    if (typeof window.firebaseDB === 'undefined') {
        window.addEventListener('firebaseLoaded', syncGlobalGemini);
        return;
    }
    const keyRef = window.firebaseRef(window.firebaseDB, 'dinepro/config/geminiKey');
    window.firebaseOnValue(keyRef, (snapshot) => {
        const key = snapshot.val();
        if (key) {
            globalGeminiKey = key;
            localStorage.setItem('dinepro_gemini_key', key);
        }
    });
}
syncGlobalGemini();

async function handleBotResponse(userText) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    // Show typing state
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing';
    typingDiv.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    const query = userText.toLowerCase();
    let response = "I'm not sure about that. Would you like to speak with a consultant on WhatsApp?";

    // --- USE GLOBAL KEY ---
    if (globalGeminiKey) {
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${globalGeminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `You are a helpful assistant for DinePro Advisors, a restaurant consulting firm. Use a professional, helpful tone. User asks: ${userText}` }]
                    }]
                })
            });
            const data = await res.json();
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                response = data.candidates[0].content.parts[0].text;
            }
        } catch (e) {
            console.error("Gemini fail", e);
        }
    } else {
        // FALLBACK TO MOCK
        if (query.includes('hello') || query.includes('hi')) {
            response = "Hello! Welcome to DinePro Advisors. How can we help your hospitality business today?";
        } else if (query.includes('service') || query.includes('what do you do')) {
            response = "We offer Concept Development, Menu Engineering, Staff Training, and Operational Audits. Which one interest you?";
        } else if (query.includes('price') || query.includes('cost')) {
            response = "Our pricing is tailored to each project. You can get a free consultation via WhatsApp to discuss your needs!";
        } else if (query.includes('contact') || query.includes('call')) {
            response = "You can reach us at +94 76 258 3670 or email udaradon@yahoo.com.";
        }
    }

    typingDiv.remove();
    addMessage(response, 'bot');
}

function sendUserMessage() {
    const text = chatInput.value.trim();
    if (text) {
        addMessage(text, 'user');
        chatInput.value = '';
        handleBotResponse(text);
    }
}

if (sendMessage) sendMessage.addEventListener('click', sendUserMessage);
if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendUserMessage();
    });
}

// Make Search Work (Mock Search Logic)
const helpSearch = document.getElementById('helpSearch');
const searchResults = document.getElementById('searchResults');

const mockArticles = [
    { title: 'How to start a restaurant?', desc: 'A step-by-step guide for beginners.' },
    { title: 'Menu engineering tips', desc: 'Optimize your menu for maximum profit.' },
    { title: 'Staff training best practices', desc: 'Build a world-class hospitality team.' },
    { title: 'Improving profitability', desc: 'Reduce waste and increase your margins.' },
    { title: 'Concept development', desc: 'Creating a unique brand for your restaurant.' }
];

if (helpSearch && searchResults) {
    helpSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        searchResults.innerHTML = '';

        if (query.length > 0) {
            const filtered = mockArticles.filter(art =>
                art.title.toLowerCase().includes(query) ||
                art.desc.toLowerCase().includes(query)
            );

            searchResults.style.display = 'block';

            if (filtered.length > 0) {
                filtered.forEach(art => {
                    const div = document.createElement('div');
                    div.className = 'result-item';
                    div.innerHTML = `<h5>${art.title}</h5><p>${art.desc}</p>`;
                    div.onclick = () => {
                        showChat();
                        addMessage(`I'm interested in: ${art.title}`, 'user');
                        handleBotResponse(art.title);
                    };
                    searchResults.appendChild(div);
                });
            } else {
                searchResults.innerHTML = '<div class="no-results">No results found. Try another keyword.</div>';
            }
        } else {
            searchResults.style.display = 'none';
        }
    });
}

// Fade in elements on scroll
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card').forEach(card => {
    observer.observe(card);
});

// Hero Slider Logic
const slides = document.querySelectorAll('.slide');
const nextBtn = document.querySelector('.arrow.next');
const prevBtn = document.querySelector('.arrow.prev');
let currentSlide = 0;
let slideInterval;

function nextSlide() {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
}

function prevSlide() {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
}

function startSlideTimer() {
    stopSlideTimer();
    slideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
}

function stopSlideTimer() {
    if (slideInterval) clearInterval(slideInterval);
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        nextSlide();
        startSlideTimer();
    });
}

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        prevSlide();
        startSlideTimer();
    });
}

// Start auto-slide
startSlideTimer();

// Global Toggle Form Function
function toggleForm(containerId, btn) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.classList.toggle('active');
    btn.classList.toggle('active');

    if (container.classList.contains('active')) {
        btn.innerHTML = `<i class="fas fa-times"></i> Close Form`;
    } else {
        // Dynamic labels based on ID for better UX
        if (containerId === 'bookingCollapsible') {
            btn.innerHTML = `<i class="fas fa-calendar-plus"></i> Open Booking Form`;
        } else if (containerId === 'reviewCollapsible') {
            btn.innerHTML = `<i class="fas fa-pen-fancy"></i> Write a Review`;
        } else if (containerId === 'contactCollapsible') {
            btn.innerHTML = `<i class="fas fa-envelope-open-text"></i> Send Us a Message`;
        }
    }
}

// Mobile Menu Logic
const mobileToggle = document.querySelector('.mobile-toggle');
const navLinks = document.querySelector('.nav-links');
const dropdowns = document.querySelectorAll('.dropdown');

if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        mobileToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
}

// Close mobile menu when a link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        if (!link.parentElement.classList.contains('dropdown')) {
            if (mobileToggle) mobileToggle.classList.remove('active');
            if (navLinks) navLinks.classList.remove('active');
        }
    });
});

// Dropdown toggle for mobile
dropdowns.forEach(dropdown => {
    dropdown.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
            dropdown.classList.toggle('active');
        }
    });
});

if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        const submitBtn = this.querySelector('.submit-btn');
        const successMessage = document.getElementById('contactSuccessMessage');

        // Loading state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SENDING...';
        }

        const submission = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            subject: formData.get('subject') || 'Contact Us Inquiry',
            message: formData.get('message'),
            date: new Date().toLocaleString(),
            timestamp: Date.now()
        };

        // 1. Sync to Firebase if available
        if (window.firebaseDB) {
            const submissionsRef = window.firebaseRef(window.firebaseDB, 'dinepro/submissions');
            window.firebasePush(submissionsRef, submission);
        }

        // 2. Keep local backup
        let submissions = JSON.parse(localStorage.getItem('dinepro_submissions') || '[]');
        submissions.unshift(submission);
        localStorage.setItem('dinepro_submissions', JSON.stringify(submissions.slice(0, 50)));

        // 3. Send Email via FormSubmit (AJAX)
        fetch(this.action, {
            method: "POST",
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'SUBMIT NOW';
            }
            if (successMessage) {
                successMessage.style.display = 'block';
                setTimeout(() => { successMessage.style.display = 'none'; }, 6000);
            }
            this.reset();
        })
        .catch(error => {
            console.error('Error sending email:', error);
            alert('Your request was saved but there was an error sending the notification. We will contact you soon!');
            this.reset();
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'SUBMIT NOW';
            }
        });
    });
}

// Secret Admin Access - Type 'admin' on the page to open the panel
let secretBuffer = '';
document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key && e.key.length === 1) {
        secretBuffer += e.key.toLowerCase();
        if (secretBuffer.length > 5) {
            secretBuffer = secretBuffer.slice(-5);
        }
        if (secretBuffer === 'admin') {
            // Open admin page
            window.location.href = atob('YWRtaW4uaHRtbA=='); // decoded: admin.html
        }
    }
});

// Mobile Secret Admin Access - Tap the logo 5 times quickly
let logoTapCount = 0;
let logoTapTimer;
const logos = document.querySelectorAll('.logo');

logos.forEach(logo => {
    logo.addEventListener('click', function (e) {
        logoTapCount++;

        clearTimeout(logoTapTimer);

        if (logoTapCount >= 5) {
            // Open admin page on 5th rapid tap
            window.location.href = atob('YWRtaW4uaHRtbA=='); // decoded: admin.html
            logoTapCount = 0; // Reset
        } else {
            // Reset tap count if 1 second passes without another tap
            logoTapTimer = setTimeout(() => {
                logoTapCount = 0;
            }, 1000);
        }
    });
});

// Reviews System
const reviewForm = document.getElementById('reviewForm');
const reviewsContainer = document.getElementById('reviewsContainer');
const reviewSuccessMessage = document.getElementById('reviewSuccessMessage');

// Mock initial reviews
const initialReviews = [
    {
        name: "James Anderson",
        rating: 5,
        text: "DinePro Advisors completely transformed our restaurant operations. Their staff training program is second to none! Highly recommended.",
        date: "October 12, 2025"
    },
    {
        name: "Sarah Jenkins",
        rating: 5,
        text: "The menu engineering insights helped us increase our profit margins by 15% in just three months. They know their stuff.",
        date: "November 05, 2025"
    },
    {
        name: "Michael Chen",
        rating: 4,
        text: "Very professional team. The operational audit revealed bottlenecks we didn't even know existed. Great value for the consulting fee.",
        date: "January 20, 2026"
    }
];

function loadReviews() {
    if (!reviewsContainer) return;

    // Show initial mock reviews until Firebase loads
    const storedReviews = JSON.parse(localStorage.getItem('dinepro_reviews')) || initialReviews;
    renderReviews(storedReviews);

    // Sync from Firebase
    if (typeof window.firebaseDB === 'undefined') {
        window.addEventListener('firebaseLoaded', loadReviews);
        return;
    }

    const reviewsRef = window.firebaseRef(window.firebaseDB, 'dinepro/reviews');
    window.firebaseOnValue(reviewsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Convert Firebase object to array and sort by timestamp/date
            const fbReviews = Object.values(data).reverse();
            renderReviews(fbReviews);
            // Backup to local
            localStorage.setItem('dinepro_reviews', JSON.stringify(fbReviews));
        } else {
            // If Firebase is empty, use initial and push them once
            renderReviews(initialReviews);
            initialReviews.forEach(r => window.firebasePush(reviewsRef, r));
        }
    });
}

function renderReviews(reviews) {
    if (!reviewsContainer) return;
    reviewsContainer.innerHTML = '';

    if (reviews.length === 0) {
        reviewsContainer.innerHTML = '<p style="text-align: center; color: #777; width: 100%; grid-column: 1 / -1;">No reviews yet. Be the first to leave one!</p>';
        return;
    }

    reviews.forEach(review => {
        let starsHtml = '';
        const rating = parseInt(review.rating) || 5;
        for (let i = 1; i <= 5; i++) {
            starsHtml += i <= rating ? '★' : '☆';
        }

        let initials = review.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        if (!initials) initials = 'U';

        const reviewHTML = `
            <div class="review-card fade-in">
                <div>
                    <div class="review-stars">${starsHtml}</div>
                    <div class="review-text">"${review.text}"</div>
                </div>
                <div class="reviewer-info">
                    <div class="reviewer-avatar">${initials}</div>
                    <div>
                        <div class="reviewer-name">${review.name}</div>
                        <div class="reviewer-date">${review.date}</div>
                    </div>
                </div>
            </div>
        `;
        reviewsContainer.insertAdjacentHTML('beforeend', reviewHTML);
    });
}

if (reviewForm) {
    reviewForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const nameInput = document.getElementById('reviewerName').value;
        const ratingInput = parseInt(document.getElementById('reviewRating').value);
        const textInput = document.getElementById('reviewText').value;

        const today = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = today.toLocaleDateString('en-US', options);

        const newReview = {
            name: nameInput,
            rating: ratingInput,
            text: textInput,
            date: dateString,
            timestamp: Date.now()
        };

        // Sync to Firebase
        if (window.firebaseDB) {
            const reviewsRef = window.firebaseRef(window.firebaseDB, 'dinepro/reviews');
            window.firebasePush(reviewsRef, newReview);
        } else {
            // Local fallback
            const storedReviews = JSON.parse(localStorage.getItem('dinepro_reviews') || '[]');
            storedReviews.unshift(newReview);
            localStorage.setItem('dinepro_reviews', JSON.stringify(storedReviews));
            loadReviews();
        }

        // Clear form
        reviewForm.reset();

        // Show success message
        if (reviewSuccessMessage) {
            reviewSuccessMessage.style.display = 'block';
            setTimeout(() => {
                reviewSuccessMessage.style.display = 'none';
            }, 4000);
        }
    });
}

// Booking Form Sync with Firebase
const bookingForm = document.getElementById('bookingForm');
const bookingSuccessMessage = document.getElementById('bookingSuccessMessage');
let existingBookings = [];

// Fetch existing bookings to prevent double booking
function fetchExistingBookings() {
    if (typeof window.firebaseDB === 'undefined') {
        window.addEventListener('firebaseLoaded', fetchExistingBookings);
        return;
    }
    const bookingsRef = window.firebaseRef(window.firebaseDB, 'dinepro/bookings');
    window.firebaseOnValue(bookingsRef, (snapshot) => {
        const data = snapshot.val();
        existingBookings = data ? Object.values(data) : [];
    });
}

// Check availability live
function checkAvailability() {
    const dateInput = document.getElementById('bookingDate').value;
    const timeInput = document.getElementById('bookingTime').value;
    const submitBtn = bookingForm.querySelector('button[type="submit"]');

    if (!dateInput || !timeInput) return;

    const isTaken = existingBookings.some(b => b.date === dateInput && b.time === timeInput);

    if (isTaken) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.innerText = 'Slot Unavailable';
        submitBtn.style.background = '#888';
    } else {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.innerText = 'Confirm Booking';
        submitBtn.style.background = 'var(--primary-color)';
    }
}

if (bookingForm) {
    // Check when date or time changes
    document.getElementById('bookingDate').addEventListener('change', checkAvailability);
    document.getElementById('bookingTime').addEventListener('change', checkAvailability);

    bookingForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const submitBtn = bookingForm.querySelector('button[type="submit"]');

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESSING...';
        }

        const date = document.getElementById('bookingDate').value;
        const time = document.getElementById('bookingTime').value;
        const name = document.getElementById('bookingName').value;
        const email = document.getElementById('bookingEmail').value;
        const phone = document.getElementById('bookingPhone').value;
        const service = document.getElementById('bookingService').value;
        const message = document.getElementById('bookingMessage').value;

        const bookingData = {
            name, email, phone, service, date, time, message,
            timestamp: Date.now(),
            status: 'Pending'
        };

        // 1. Sync to Firebase
        if (window.firebaseDB) {
            const bookingsRef = window.firebaseRef(window.firebaseDB, 'dinepro/bookings');
            window.firebasePush(bookingsRef, bookingData);
        }

        // 2. Send Notification Email via FormSubmit
        const bookingFormData = new FormData();
        bookingFormData.append('Type', 'New Consultation Booking Request');
        bookingFormData.append('Name', name);
        bookingFormData.append('Email', email);
        bookingFormData.append('Phone', phone);
        bookingFormData.append('Service', service);
        bookingFormData.append('Preferred Date', date);
        bookingFormData.append('Preferred Time', time);
        bookingFormData.append('Requirements', message);
        bookingFormData.append('_subject', 'DinePro: New Consultation Booking Request');

        fetch("https://formsubmit.co/ajax/udaradon@yahoo.com", {
            method: "POST",
            body: bookingFormData,
        })
        .then(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Confirm Booking';
            }
            if (bookingSuccessMessage) {
                bookingSuccessMessage.style.display = 'block';
                setTimeout(() => { bookingSuccessMessage.style.display = 'none'; }, 6000);
            }
            bookingForm.reset();
        })
        .catch(err => {
            console.error('Email error:', err);
            // Even if email fails, it's saved in Firebase
            if (bookingSuccessMessage) bookingSuccessMessage.style.display = 'block';
            bookingForm.reset();
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Confirm Booking';
            }
        });
    });
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadReviews();
    fetchExistingBookings();
});
// If it's already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(loadReviews, 1);
}

// --- PWA INSTALLATION LOGIC ---
const installBanner = document.createElement('div');
installBanner.id = 'pwa-install-banner';
installBanner.style.cssText = `
    position: fixed; bottom: 20px; left: 20px; right: 20px; 
    background: white; padding: 20px; border-radius: 15px; 
    box-shadow: 0 10px 40px rgba(0,0,0,0.2); 
    display: none; z-index: 999999; border: 1px solid rgba(93, 58, 26, 0.1);
    animation: fadeInUp 0.5s ease;
`;
installBanner.innerHTML = `
    <div style="display: flex; align-items: center; gap: 15px;">
        <img src="logo.png.png" style="width: 50px; height: 50px; border-radius: 12px; object-fit: contain;">
        <div style="flex-grow: 1;">
            <h4 style="margin: 0; font-size: 16px; color: #333;">Install DinePro App</h4>
            <p style="margin: 3px 0 0; font-size: 11px; color: #666;">Experience full app features & notifications</p>
        </div>
        <button id="pwa-install-btn" style="background: #5D3A1A; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer;">Install</button>
        <button id="pwa-close-banner" style="background: none; border: none; font-size: 18px; color: #999; cursor: pointer;">&times;</button>
    </div>
`;
document.body.appendChild(installBanner);

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBanner.style.setProperty('display', 'block', 'important');
});

document.addEventListener('click', (e) => {
    if (e.target.id === 'pwa-install-btn') {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => {
                installBanner.style.display = 'none';
            });
            deferredPrompt = null;
        } else {
            alert("📱 To Install on iPhone:\n\n1. Tap the Share button at bottom.\n2. Tap 'Add to Home Screen'.");
        }
    }
    if (e.target.id === 'pwa-close-banner') {
        installBanner.style.display = 'none';
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch((err) => console.log('SW fail:', err));
    });
}
