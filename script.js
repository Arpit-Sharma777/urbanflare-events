// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerHeight = document.querySelector('header').offsetHeight;
            const targetPosition = target.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Video Background Management
class VideoBackgroundManager {
    constructor() {
        this.video = document.getElementById('heroVideo');
        this.fallbackImage = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1920&h=1080&fit=crop';
        this.videoSources = [
            'vid1.mp4',
            'vid2.mp4'
        ];
        this.currentVideoIndex = 0;
        this.videoRotationEnabled = true; // Set to false if you want only fallback behavior
        this.rotationInterval = 15000; // 15 seconds per video
        this.init();
    }


    init() {
        if (!this.video){ return;}

        // Set video properties for better performance
        this.video.muted = true;
        this.video.playsInline = true;
        this.video.loop = !this.videoRotationEnabled; // Only loop if not rotating
        this.video.preload = 'metadata';
        
        // Handle video loading states
        this.setupVideoHandlers();
        
        // Performance optimization
        this.handleVideoPerformance();
        
        // Fallback handling
        this.setupFallback();
        
        // Setup video rotation if enabled
        if (this.videoRotationEnabled) {
            this.setupVideoRotation();
        }
        
        // Attempt to play video
        this.playVideo();
    }

    setupVideoHandlers() {
        // Video loaded successfully
        this.video.addEventListener('loadeddata', () => {
            console.log(`Video ${this.currentVideoIndex + 1} loaded successfully`);
            this.video.style.opacity = '1';
            this.hideLoader();
        });

        // Video can start playing
        this.video.addEventListener('canplay', () => {
            this.video.style.opacity = '1';
            this.playVideo();
        });

        // Video loading error
        this.video.addEventListener('error', (e) => {
            console.warn(`Video ${this.currentVideoIndex + 1} failed to load:`, e);
            if (this.videoRotationEnabled && this.currentVideoIndex < this.videoSources.length - 1) {
                console.log('Trying next video source...');
                this.switchToNextVideo();
            } else {
                this.showFallback();
            }
        });

        // Video ended
        this.video.addEventListener('ended', () => {
            if (this.videoRotationEnabled) {
                this.switchToNextVideo();
            } else {
                this.video.currentTime = 0;
                this.playVideo();
            }
        });

        // Video is playing
        this.video.addEventListener('playing', () => {
            this.video.style.opacity = '1';
            this.hideLoader();
        });

        // Video paused
        this.video.addEventListener('pause', () => {
            // Auto-resume if paused unexpectedly (but not during video switching)
            if (!this.isSwitchingVideo) {
                setTimeout(() => {
                    if (this.video.paused && this.isVideoVisible()) {
                        this.playVideo();
                    }
                }, 1000);
            }
        });
    }

    setupVideoRotation() {
        // Start with a random video
        this.currentVideoIndex = Math.floor(Math.random() * this.videoSources.length);
        
        // Set up automatic rotation
        setInterval(() => {
            if (this.isVideoVisible() && !this.video.paused) {
                this.switchToNextVideo();
            }
        }, this.rotationInterval);
    }

    switchToNextVideo() {
        this.isSwitchingVideo = true;
        
        // Fade out current video
        this.video.style.opacity = '0';
        
        setTimeout(() => {
            // Move to next video
            this.currentVideoIndex = (this.currentVideoIndex + 1) % this.videoSources.length;
            
            // Clear existing sources
            this.video.innerHTML = '';
            
            // Add new source
            const source = document.createElement('source');
            source.src = this.videoSources[this.currentVideoIndex];
            source.type = 'video/mp4';
            this.video.appendChild(source);
            
            // Reload and play
            this.video.load();
            
            console.log(`Switching to video ${this.currentVideoIndex + 1}:`, this.videoSources[this.currentVideoIndex]);
            
            // Reset switching flag
            this.isSwitchingVideo = false;
            
            // Play new video
            this.playVideo();
        }, 500);
    }

    async playVideo() {
        try {
            await this.video.play();
        } catch (error) {
            console.warn('Autoplay failed:', error);
            // Some browsers block autoplay, show fallback
            this.showFallback();
        }
    }

    handleVideoPerformance() {
        // Pause video when not visible (performance optimization)
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.playVideo();
                } else {
                    this.video.pause();
                }
            });
        }, { threshold: 0.1 });

        observer.observe(this.video);

        // Pause video on page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.video.pause();
            } else if (this.isVideoVisible()) {
                this.playVideo();
            }
        });

        // Handle reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.showFallback();
            return;
        }
    }

    setupFallback() {
        const videoContainer = this.video.parentElement;
        
        // Create fallback image element
        const fallbackImg = document.createElement('div');
        fallbackImg.className = 'video-fallback';
        fallbackImg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url(${this.fallbackImage});
            background-size: cover;
            background-position: center;
            opacity: 0;
            transition: opacity 0.5s ease;
            z-index: -3;
        `;
        
        videoContainer.appendChild(fallbackImg);
        this.fallbackElement = fallbackImg;
    }

    showFallback() {
        if (this.fallbackElement) {
            this.video.style.opacity = '0';
            this.fallbackElement.style.opacity = '1';
        }
        this.hideLoader();
    }

    isVideoVisible() {
        const rect = this.video.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
    }

    hideLoader() {
        const loader = document.querySelector('.video-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
        }
    }

    // Public methods for external control
    pause() {
        this.video.pause();
    }

    play() {
        this.playVideo();
    }

    setVolume(volume) {
        this.video.volume = Math.max(0, Math.min(1, volume));
    }

    // Enable/disable video rotation
    setVideoRotation(enabled) {
        this.videoRotationEnabled = enabled;
        this.video.loop = !enabled;
    }

    // Manually switch to next video
    nextVideo() {
        if (this.videoRotationEnabled) {
            this.switchToNextVideo();
        }
    }

    // Get current video info
    getCurrentVideoInfo() {
        return {
            index: this.currentVideoIndex,
            source: this.videoSources[this.currentVideoIndex],
            total: this.videoSources.length
        };
    }
}

// Mobile menu toggle
const mobileToggle = document.querySelector('.mobile-menu-toggle');
const nav = document.querySelector('nav');

if (mobileToggle && nav) {
    mobileToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
        mobileToggle.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
            mobileToggle.classList.remove('active');
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !mobileToggle.contains(e.target)) {
            nav.classList.remove('active');
            mobileToggle.classList.remove('active');
        }
    });
}

// Fade in animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all fade-in elements
document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
});

// Marquee animation setup
function setupMarquee() {
    const marquees = document.querySelectorAll('.marquee-track');
    
    marquees.forEach(marquee => {
        const images = marquee.querySelectorAll('img');
        // Clone images for seamless loop
        images.forEach(img => {
            const clone = img.cloneNode(true);
            marquee.appendChild(clone);
        });
    });
}

// Header background change on scroll with throttle
let ticking = false;

function updateHeader() {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.15)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    }
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
    }
});

// Enhanced Construction Labour Contract Service Highlighting
function highlightConstructionService() {
    const constructionCard = document.querySelector('.service-card.highlighted');
    if (constructionCard) {
        // Add special attention-grabbing effects
        constructionCard.style.animation = 'pulse 2s infinite, glow 3s ease-in-out infinite alternate';
        
        // Add mouse tracking effect
        constructionCard.addEventListener('mousemove', (e) => {
            const rect = constructionCard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            constructionCard.style.setProperty('--mouse-x', x + 'px');
            constructionCard.style.setProperty('--mouse-y', y + 'px');
        });
        
        // Add periodic highlight flash
        setInterval(() => {
            constructionCard.style.transform = 'scale(1.08) translateY(-15px)';
            setTimeout(() => {
                constructionCard.style.transform = 'scale(1.05)';
            }, 200);
        }, 5000);
    }
}

// Service card interaction enhancements
function enhanceServiceCards() {
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            if (card.classList.contains('highlighted')) {
                card.style.boxShadow = '0 30px 80px rgba(102, 126, 234, 0.5)';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            if (card.classList.contains('highlighted')) {
                card.style.boxShadow = '0 20px 60px rgba(102, 126, 234, 0.3)';
            }
        });
    });
}

// Contact form handling with validation
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    // Form validation
    function validateForm(formData) {
        const errors = [];
        
        if (!formData.get('name') || formData.get('name').trim().length < 2) {
            errors.push('Please enter a valid name (at least 2 characters)');
        }
        
        const email = formData.get('email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            errors.push('Please enter a valid email address');
        }
        
        const phone = formData.get('phone');
        const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
        if (!phone || !phoneRegex.test(phone.replace(/\s/g, ''))) {
            errors.push('Please enter a valid phone number');
        }
        
        if (!formData.get('service')) {
            errors.push('Please select a service');
        }
        
        if (!formData.get('purpose') || formData.get('purpose').trim().length < 10) {
            errors.push('Please provide more details about your requirements (at least 10 characters)');
        }
        
        return errors;
    }

    // Show error messages
    function showErrors(errors) {
        // Remove existing error messages
        const existingErrors = contactForm.querySelectorAll('.error-message');
        existingErrors.forEach(error => error.remove());
        
        if (errors.length > 0) {
            const errorContainer = document.createElement('div');
            errorContainer.className = 'error-message';
            errorContainer.style.cssText = `
                background: #ff4757;
                color: white;
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1rem;
                animation: fadeInUp 0.3s ease;
            `;
            errorContainer.innerHTML = `
                <strong>Please fix the following errors:</strong>
                <ul style="margin: 0.5rem 0 0 1rem;">
                    ${errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            `;
            contactForm.insertBefore(errorContainer, contactForm.firstChild);
        }
    }

    // Show success message
    function showSuccess() {
        const existingMessages = contactForm.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());
        
        const successContainer = document.createElement('div');
        successContainer.className = 'success-message';
        successContainer.style.cssText = `
            background: #2ed573;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            animation: fadeInUp 0.3s ease;
        `;
        successContainer.innerHTML = `
            <strong>✓ Message sent successfully!</strong>
            <p style="margin: 0.5rem 0 0 0;">Thank you for your inquiry. We'll get back to you within 24 hours.</p>
        `;
        contactForm.insertBefore(successContainer, contactForm.firstChild);
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
            successContainer.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => successContainer.remove(), 300);
        }, 5000);
    }

    // Handle form submission
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(contactForm);
        const errors = validateForm(formData);

        if (errors.length > 0) {
            showErrors(errors);
            return;
        }

        // Show loading state
        const submitBtn = contactForm.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Sending...</span><div class="btn-loader"></div>';
        submitBtn.disabled = true;

        try {
            // POST to Web3Forms
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                showSuccess();
                contactForm.reset();
            } else {
                showErrors(['Failed to send message. Please try again.']);
            }
        } catch (error) {
            showErrors(['Failed to send message. Please try again.']);
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

// Initialize image loading
function initImageLoading() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (img.complete) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', () => {
                img.classList.add('loaded');
            });
        }
    });
}

// Initialize animations for service cards
function initServiceAnimations() {
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach((card, index) => {
        // Stagger animation delays
        card.style.animationDelay = `${index * 0.1}s`;
        
        // Add hover effects
        card.addEventListener('mouseenter', () => {
            card.style.transform = card.classList.contains('highlighted') 
                ? 'scale(1.08) translateY(-15px)' 
                : 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = card.classList.contains('highlighted') 
                ? 'scale(1.05)' 
                : 'translateY(0)';
        });
    });
}

// Add CSS animations for glow effect and video loader
function addGlowEffect() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes glow {
            0% {
                box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
            }
            50% {
                box-shadow: 0 25px 70px rgba(102, 126, 234, 0.5), 0 0 30px rgba(102, 126, 234, 0.3);
            }
            100% {
                box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
            }
        }
        
        @keyframes fadeOut {
            to {
                opacity: 0;
                transform: translateY(-10px);
            }
        }
        
        @keyframes videoFadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
        
        .service-card.highlighted {
            position: relative;
            overflow: hidden;
        }
        
        .service-card.highlighted::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            transform: rotate(45deg);
            animation: shimmer 3s infinite;
        }
        
        @keyframes shimmer {
            0% {
                transform: translateX(-100%) translateY(-100%) rotate(45deg);
            }
            100% {
                transform: translateX(100%) translateY(100%) rotate(45deg);
            }
        }
        
        #heroVideo {
            opacity: 0;
            transition: opacity 0.5s ease;
        }
        
        .video-controls {
            position: absolute;
            bottom: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 2;
        }
        
        .video-control-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }
        
        .video-control-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        
        .video-indicator {
            position: absolute;
            bottom: 20px;
            left: 20px;
            color: white;
            font-size: 12px;
            background: rgba(0, 0, 0, 0.3);
            padding: 5px 10px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            z-index: 2;
        }
        
        .video-loader {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid #fff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            z-index: 1;
        }
        
        @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// Add video controls and indicator
function addVideoControls() {
    const videoContainer = document.querySelector('.video-background');
    if (!videoContainer || videoContainer.querySelector('.video-controls')) return;

    // Add video controls
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'video-controls';
    controlsContainer.innerHTML = `
        <button class="video-control-btn" id="toggleRotation">Auto Switch: ON</button>
        <button class="video-control-btn" id="nextVideoBtn">Next Video</button>
        <button class="video-control-btn" id="pauseVideoBtn">Pause</button>
    `;
    
    // Add video indicator
    const indicator = document.createElement('div');
    indicator.className = 'video-indicator';
    indicator.id = 'videoIndicator';
    indicator.textContent = 'Video 1 of 2';
    
    videoContainer.appendChild(controlsContainer);
    videoContainer.appendChild(indicator);
    
    // Setup control event listeners
    setupVideoControlListeners();
}

/**
 * Updates the on-screen video indicator text based on the current video index.
 */
function updateVideoIndicator() {
  const indicator = document.getElementById('videoIndicator');
  if (!indicator || !videoManager) return;
  const info = videoManager.getCurrentVideoInfo(); // { index, total, source }
  indicator.textContent = `Video ${info.index + 1} of ${info.total}`;
}

function setupVideoControlListeners() {
    const toggleBtn = document.getElementById('toggleRotation');
    const nextBtn = document.getElementById('nextVideoBtn');
    const pauseBtn = document.getElementById('pauseVideoBtn');
    const indicator = document.getElementById('videoIndicator');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (videoManager) {
                videoManager.videoRotationEnabled = !videoManager.videoRotationEnabled;
                videoManager.setVideoRotation(videoManager.videoRotationEnabled);
                toggleBtn.textContent = `Auto Switch: ${videoManager.videoRotationEnabled ? 'ON' : 'OFF'}`;
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (videoManager) {
                videoManager.nextVideo();
                updateVideoIndicator();
            }
        });
    }
    
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (videoManager && videoManager.video) {
                if (videoManager.video.paused) {
                    videoManager.play();
                    pauseBtn.textContent = 'Pause';
                } else {
                    videoManager.pause();
                    pauseBtn.textContent = 'Play';
                }
            }
        });
    }
    
    // Update indicator when video changes
    setInterval(updateVideoIndicator, 1000);
}

// Add video loader
function addVideoLoader() {
    const videoContainer = document.querySelector('.video-background');
    if (videoContainer && !videoContainer.querySelector('.video-loader')) {
        const loader = document.createElement('div');
        loader.className = 'video-loader';
        videoContainer.appendChild(loader);
    }
}

// Performance monitoring for video
function monitorVideoPerformance() {
    const video = document.getElementById('heroVideo');
    if (!video) return;

    // Monitor video loading performance
    const startTime = performance.now();
    
    video.addEventListener('loadeddata', () => {
        const loadTime = performance.now() - startTime;
        console.log(`Video loaded in ${loadTime.toFixed(2)}ms`);
        
        // If loading took too long, consider showing fallback next time
        if (loadTime > 5000) {
            console.warn('Video loading took longer than expected');
        }
    });
}

// Global video manager instance
let videoManager;

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize video background manager
    videoManager = new VideoBackgroundManager();
    
    // Add video loader and controls
    addVideoLoader();
    addVideoControls();
    
    // Setup other components
    setupMarquee();
    initImageLoading();
    initServiceAnimations();
    highlightConstructionService();
    enhanceServiceCards();
    addGlowEffect();
    
    // Monitor performance
    monitorVideoPerformance();
    
    // Mark body as loaded
    document.body.classList.add('loaded');
});

// Add resize handler for responsive adjustments
window.addEventListener('resize', () => {
    // Recalculate marquee if needed
    if (window.innerWidth <= 768) {
        const highlightedCard = document.querySelector('.service-card.highlighted');
        if (highlightedCard) {
            highlightedCard.style.transform = 'none';
        }
    }
});

// Handle page visibility changes for video optimization
document.addEventListener('visibilitychange', () => {
    if (videoManager) {
        if (document.hidden) {
            videoManager.pause();
        } else {
            videoManager.play();
        }
    }
});

// Preload critical images
function preloadImages() {
    const imageUrls = [
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=400&fit=crop'
    ];
    
    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

// Initialize preloading
preloadImages();

// Export video manager for external access if needed
window.UrbanFlareVideoManager = videoManager;