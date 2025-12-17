// import { gsap } from 'gsap';
// import { Observer } from 'gsap/Observer';
// import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// gsap.registerPlugin(Observer, SplitText, ScrollTrigger);

import Swiper from 'swiper';
import {
  Autoplay,
  Navigation,
  Pagination,
  Scrollbar,
  Keyboard,
  Mousewheel,
  A11y,
} from 'swiper/modules';

window.Webflow ||= [];
window.Webflow.push(() => {
  // document.querySelectorAll('[data-anim~="container"]').forEach((container) => {
  //   console.log(container);

  //   gsap.set(container, {
  //     marginLeft: '1rem',
  //     marginRight: '1rem',
  //     width: 'calc(100% - 2rem)',
  //   });

  //   gsap.to(container, {
  //     marginLeft: '.5rem',
  //     marginRight: '.5rem',
  //     width: 'calc(100% - 1rem)',
  //     ease: 'power2.inOut',
  //     duration: 1,
  //     scrollTrigger: {
  //       trigger: container,
  //       start: '25% bottom',
  //       end: 'center top',
  //       // markers: true,
  //     },
  //   });
  // });

  // -----------------------------------------------------------
  // SUCCESS STORIES SWIPER //
  // -----------------------------------------------------------
  const successCarousel = new Swiper('.success-swiper_wrapper', {
    modules: [Autoplay, Navigation, Pagination, Scrollbar, Keyboard, Mousewheel, A11y],
    wrapperClass: 'success-swiper_list',
    slideClass: 'success-swiper_item',
    slidesPerView: 'auto',
    speed: 400,
    spaceBetween: 8,
    a11y: true,
    grabCursor: true,
    autoplay: false,
    keyboard: {
      onlyInViewport: true,
    },
    mousewheel: { forceToAxis: true },
    breakpoints: {},
    on: {
      beforeInit: (swiper) => {
        swiper.wrapperEl.style.columnGap = 'unset';
      },
    },
  });

  // -----------------------------------------------------------
  // TabRotator: Core functionality handler
  // -----------------------------------------------------------
  function TabRotator(container, options) {
    this.container = container;
    this.tabLinks = container.querySelectorAll('.w-tab-link');
    this.pauseable = options.pauseable;
    this.defaultSpeed = options.containerSpeed;
    this.currentIndex = 0;
    this.timer = null;
    this.isPaused = false;
    this.isHoverPaused = false;
    this.isScrollPaused = true;
    this.hasStarted = false; // Track if rotation has ever started
    this.progressLine = null;
    this.progressAnimation = null;
    this.scrollTrigger = null;

    if (!this.tabLinks.length) {
      return;
    }

    this.init();
  }

  TabRotator.prototype.init = function () {
    this.initializeProgressLines();
    this.findCurrentIndex();
    this.setupEventListeners();
    this.setupScrollTrigger();
  };

  TabRotator.prototype.setupScrollTrigger = function () {
    const self = this;

    this.scrollTrigger = ScrollTrigger.create({
      trigger: this.container,
      start: 'top 75%',
      end: 'bottom 25%',
      onEnter: () => {
        self.isScrollPaused = false;
        self.startOrResumeRotation();
      },
      onLeave: () => {
        self.isScrollPaused = true;
        self.pause();
      },
      onEnterBack: () => {
        self.isScrollPaused = false;
        self.startOrResumeRotation();
      },
      onLeaveBack: () => {
        self.isScrollPaused = true;
        self.pause();
      },
      onRefresh: () => {
        // Force check visibility after ScrollTrigger refreshes
        setTimeout(() => self.checkInitialVisibility(), 50);
      },
      // markers: true, // Remove in production
    });

    // Check initial visibility with a delay to ensure everything is ready
    setTimeout(() => {
      this.checkInitialVisibility();
    }, 250);
  };

  TabRotator.prototype.checkInitialVisibility = function () {
    // Use ScrollTrigger's built-in progress to check if in range
    if (this.scrollTrigger) {
      const progress = this.scrollTrigger.progress;
      // If progress is between 0 and 1, the element is in the active range
      if (progress >= 0 && progress <= 1 && this.scrollTrigger.isActive) {
        this.isScrollPaused = false;
        this.startOrResumeRotation();
      }
    }
  };

  // New method that handles both first start and resume
  TabRotator.prototype.startOrResumeRotation = function () {
    // Don't start if hover paused
    if (this.isHoverPaused) return;

    if (!this.hasStarted) {
      // First time starting
      this.hasStarted = true;
      this.isPaused = false;
      this.startRotation();
    } else if (this.isPaused) {
      // Resume existing rotation
      this.resume();
    }
    // If already running and not paused, do nothing
  };

  TabRotator.prototype.initializeProgressLines = function () {
    const allProgressLines = this.container.querySelectorAll('[brix-progress-line]');
    allProgressLines.forEach((line) => {
      line.style.transition = 'none';
      line.style.width = '0%';
      line.offsetHeight;
    });
  };

  TabRotator.prototype.findCurrentIndex = function () {
    let foundActive = false;
    for (let i = 0; i < this.tabLinks.length; i++) {
      if (this.tabLinks[i].classList.contains('w--current')) {
        this.currentIndex = i;
        foundActive = true;
        break;
      }
    }
    if (!foundActive && this.tabLinks[0]) {
      this.currentIndex = 0;
      this.simulateClick(this.tabLinks[0]);
    }
  };

  TabRotator.prototype.findCurrentIndexWithRetry = function (maxRetries = 5, currentRetry = 0) {
    const self = this;

    let foundActive = false;
    for (let i = 0; i < this.tabLinks.length; i++) {
      if (this.tabLinks[i].classList.contains('w--current')) {
        this.currentIndex = i;
        foundActive = true;
        break;
      }
    }

    if (foundActive || currentRetry >= maxRetries) {
      this.startRotation();
      return;
    }

    setTimeout(() => {
      self.findCurrentIndexWithRetry(maxRetries, currentRetry + 1);
    }, 100);
  };

  TabRotator.prototype.setupEventListeners = function () {
    const self = this;

    if (this.pauseable) {
      this.container.addEventListener('mouseenter', () => {
        self.isHoverPaused = true;
        if (self.hasStarted) {
          self.pause();
        }
      });
      this.container.addEventListener('mouseleave', () => {
        self.isHoverPaused = false;
        if (!self.isScrollPaused) {
          self.startOrResumeRotation();
        }
      });
      this.container.addEventListener(
        'touchstart',
        () => {
          self.isHoverPaused = true;
          if (self.hasStarted) {
            self.pause();
          }
        },
        { passive: true }
      );
      this.container.addEventListener(
        'touchend',
        () => {
          self.isHoverPaused = false;
          if (!self.isScrollPaused) {
            self.startOrResumeRotation();
          }
        },
        { passive: true }
      );
      this.container.addEventListener(
        'touchcancel',
        () => {
          self.isHoverPaused = false;
          if (!self.isScrollPaused) {
            self.startOrResumeRotation();
          }
        },
        { passive: true }
      );
    }

    this.tabLinks.forEach((link, index) => {
      link.addEventListener('click', () => self.resetAfterManualInteraction(index));
      link.addEventListener('focus', () => self.resetAfterManualInteraction(index));
    });
  };

  TabRotator.prototype.resetAfterManualInteraction = function (clickedIndex = null) {
    if (clickedIndex !== null && clickedIndex === this.currentIndex) {
      return;
    }

    clearTimeout(this.timer);
    this.timer = null;
    this.resetProgressLine();

    if (clickedIndex !== null) {
      this.currentIndex = clickedIndex;
      setTimeout(() => {
        if (!this.isScrollPaused && !this.isHoverPaused) {
          this.hasStarted = true;
          this.isPaused = false;
          this.startRotation();
        }
      }, 300);
    } else {
      setTimeout(() => {
        this.findCurrentIndexWithRetry();
      }, 300);
    }
  };

  TabRotator.prototype.findProgressLine = function () {
    const currentLink = this.tabLinks[this.currentIndex];
    this.progressLine = null;

    this.progressLine = currentLink.querySelector('[brix-progress-line]');

    if (!this.progressLine) {
      const href = currentLink.getAttribute('href');
      if (href && href.startsWith('#')) {
        const tabPane = document.querySelector(href);
        if (tabPane) {
          this.progressLine = tabPane.querySelector('[brix-progress-line]');
        }
      }

      if (!this.progressLine) {
        const tabTarget = currentLink.getAttribute('data-w-tab');
        if (tabTarget) {
          const tabPane = document.querySelector(`[data-w-tab="${tabTarget}"]`);
          if (tabPane) {
            this.progressLine = tabPane.querySelector('[brix-progress-line]');
          }
        }
      }
    }

    if (!this.progressLine) {
      this.progressLine = this.container.querySelector('[brix-progress-line]');
    }
  };

  TabRotator.prototype.startProgressLine = function (duration) {
    this.findProgressLine();
    if (!this.progressLine) return;

    this.resetCurrentProgressLine();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.progressLine && !this.isPaused) {
          this.progressLine.style.transition = `width ${duration}ms linear`;
          this.progressLine.style.width = '100%';
        }
      });
    });
  };

  TabRotator.prototype.resetCurrentProgressLine = function () {
    if (this.progressLine) {
      this.progressLine.style.transition = 'none';
      this.progressLine.style.width = '0%';
      this.progressLine.offsetHeight;
    }
  };

  TabRotator.prototype.resetProgressLine = function () {
    const allProgressLines = this.container.querySelectorAll('[brix-progress-line]');
    allProgressLines.forEach((line) => {
      line.style.transition = 'none';
      line.style.width = '0%';
      line.offsetHeight;
    });

    if (this.progressLine) {
      this.progressLine.style.transition = 'none';
      this.progressLine.style.width = '0%';
      this.progressLine.offsetHeight;
    }
  };

  TabRotator.prototype.pauseProgressLine = function () {
    this.findProgressLine();
    if (!this.progressLine) return;

    const currentWidth = this.progressLine.getBoundingClientRect().width;
    const parentWidth = this.progressLine.parentElement.getBoundingClientRect().width;
    const currentPercentage = (currentWidth / parentWidth) * 100;

    this.progressLine.style.transition = 'none';
    this.progressLine.style.width = `${currentPercentage}%`;
  };

  TabRotator.prototype.resumeProgressLine = function (remainingTime) {
    this.findProgressLine();
    if (!this.progressLine || this.isPaused) return;

    requestAnimationFrame(() => {
      if (this.progressLine && !this.isPaused) {
        this.progressLine.style.transition = `width ${remainingTime}ms linear`;
        this.progressLine.style.width = '100%';
      }
    });
  };

  TabRotator.prototype.startRotation = function () {
    // Check all pause conditions
    if (this.isPaused || this.isScrollPaused || this.isHoverPaused) return;

    clearTimeout(this.timer);

    const currentLink = this.tabLinks[this.currentIndex];
    const speedAttr = currentLink.getAttribute('brix-autotabs-speed');
    let speed = parseInt(speedAttr, 10);

    if (isNaN(speed) || speed <= 0) {
      speed = this.defaultSpeed;
    }

    this.startProgressLine(speed);

    this.timer = setTimeout(() => {
      const nextIndex = (this.currentIndex + 1) % this.tabLinks.length;
      const nextLink = this.tabLinks[nextIndex];
      this.simulateClick(nextLink);

      setTimeout(() => {
        this.findCurrentIndex();
        this.startRotation();
      }, 150);
    }, speed);
  };

  TabRotator.prototype.simulateClick = function (link) {
    const storedHref = link.getAttribute('href');
    if (storedHref) {
      link.removeAttribute('href');
    }

    link.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      })
    );

    if (storedHref) {
      link.setAttribute('href', storedHref);
    }
  };

  TabRotator.prototype.pause = function () {
    this.isPaused = true;
    clearTimeout(this.timer);
    this.timer = null;
    this.pauseProgressLine();
  };

  TabRotator.prototype.resume = function () {
    if (!this.isPaused) return;
    this.isPaused = false;

    this.findCurrentIndex();

    const currentLink = this.tabLinks[this.currentIndex];
    const speedAttr = currentLink.getAttribute('brix-autotabs-speed');
    let totalSpeed = parseInt(speedAttr, 10);

    if (isNaN(totalSpeed) || totalSpeed <= 0) {
      totalSpeed = this.defaultSpeed;
    }

    this.findProgressLine();

    let remainingTime = totalSpeed;
    if (this.progressLine) {
      const currentWidth = this.progressLine.getBoundingClientRect().width;
      const parentWidth = this.progressLine.parentElement.getBoundingClientRect().width;
      const currentPercentage = (currentWidth / parentWidth) * 100;
      remainingTime = totalSpeed * ((100 - currentPercentage) / 100);
    }

    this.resumeProgressLine(remainingTime);

    this.timer = setTimeout(() => {
      const nextIndex = (this.currentIndex + 1) % this.tabLinks.length;
      const nextLink = this.tabLinks[nextIndex];
      this.simulateClick(nextLink);

      setTimeout(() => {
        this.findCurrentIndex();
        this.startRotation();
      }, 150);
    }, remainingTime);
  };

  // Cleanup method
  TabRotator.prototype.destroy = function () {
    clearTimeout(this.timer);
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
    }
  };

  // -----------------------------------------------------------
  // Initialization on DOM load
  // -----------------------------------------------------------
  function initBrixAutoTabs() {
    const containers = document.querySelectorAll('[brix-autotabs="true"]');
    if (!containers.length) return;

    containers.forEach((container) => {
      const pauseableAttr = container.getAttribute('brix-autotabs-pauseable');
      let isPauseable = true;
      if (pauseableAttr && pauseableAttr.toLowerCase() === 'false') {
        isPauseable = false;
      }

      const defaultSpeedAttr = container.getAttribute('brix-autotabs-default-speed');
      let containerDefaultSpeed = 8000;
      if (defaultSpeedAttr) {
        const parsed = parseInt(defaultSpeedAttr, 10);
        if (!isNaN(parsed) && parsed > 0) {
          containerDefaultSpeed = parsed;
        }
      }

      new TabRotator(container, {
        pauseable: isPauseable,
        containerSpeed: containerDefaultSpeed,
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBrixAutoTabs);
  } else {
    initBrixAutoTabs();
  }
});
