// import { gsap } from 'gsap';
// import { Observer } from 'gsap/Observer';
// import { SplitText } from 'gsap/SplitText';
// import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
  // PLAY MOBILE VIDEOS
  // -----------------------------------------------------------
  let mm = gsap.matchMedia();
  mm.add('(max-width: 767px)', () => {
    const videosMobile = [];
    document.querySelectorAll('[data-anim-el="video-mobile"]').forEach((videoWrapper) => {
      const video = videoWrapper.querySelector('video');
      videosMobile.push(video);
      ScrollTrigger.create({
        trigger: videoWrapper,
        start: 'center bottom',
        end: '75% top',
        onEnter: () => video.play(),
        onLeave: () => video.pause(),
        onEnterBack: () => video.play(),
        onLeaveBack: () => video.pause(),
      });
    });
    return () => {
      videosMobile.forEach((video) => video.pause());
    };
  });

  // -----------------------------------------------------------
  // TabRotator: Core functionality handler
  // -----------------------------------------------------------
  function TabRotator(container, options) {
    this.container = container;
    this.tabLinks = container.querySelectorAll('.w-tab-link');
    this.tabPanes = container.querySelectorAll('.w-tab-pane');
    this.videos = [];
    this.pauseable = options.pauseable;
    this.defaultSpeed = options.containerSpeed;
    this.currentIndex = 0;
    this.previousIndex = -1;
    this.timer = null;
    this.isPaused = false;
    this.isHoverPaused = false;
    this.isScrollPaused = true;
    this.hasStarted = false;
    this.isTabSwitching = false;
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
    this.initializeVideos();
    this.findCurrentIndex();
    this.setupEventListeners();
    this.setupScrollTrigger();
  };

  // -----------------------------------------------------------
  // VIDEO CONTROL METHODS
  // -----------------------------------------------------------
  TabRotator.prototype.initializeVideos = function () {
    this.videos = [];
    const tabsComponent = this.container.closest('.w-tabs');

    if (!tabsComponent) {
      return;
    }

    const allVideos = tabsComponent.querySelectorAll('video');

    allVideos.forEach((video) => {
      this.videos.push(video);
      video.pause();
      video.currentTime = 0;
      video.muted = true;

      if (video.readyState >= 2) {
        video.currentTime = 0;
      } else {
        video.addEventListener('loadeddata', () => {
          video.currentTime = 0;
        });
      }
    });
  };

  TabRotator.prototype.playCurrentVideo = function (resetToStart = false) {
    const currentTabPane = this.findCurrentTabPane();
    if (!currentTabPane) {
      return;
    }

    const video = currentTabPane.querySelector('video');
    if (video) {
      if (resetToStart) {
        video.currentTime = 0;
      }

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Silently handle autoplay failures
        });
      }
    }
  };

  TabRotator.prototype.pauseAllVideos = function () {
    this.videos.forEach((video) => {
      video.pause();
    });
  };

  TabRotator.prototype.resetAllVideos = function () {
    this.videos.forEach((video) => {
      video.pause();
      video.currentTime = 0;
    });
  };

  TabRotator.prototype.findCurrentTabPane = function () {
    const currentLink = this.tabLinks[this.currentIndex];
    if (!currentLink) {
      return null;
    }

    const href = currentLink.getAttribute('href');
    if (href && href.startsWith('#')) {
      const pane = document.querySelector(href);
      if (pane) return pane;
    }

    const tabTarget = currentLink.getAttribute('data-w-tab');
    if (tabTarget) {
      const pane = this.container.querySelector(`[data-w-tab="${tabTarget}"].w-tab-pane`);
      if (pane) return pane;
    }

    return null;
  };

  // -----------------------------------------------------------
  // SCROLL TRIGGER AND VIEWPORT CONTROL
  // -----------------------------------------------------------
  TabRotator.prototype.setupScrollTrigger = function () {
    const self = this;

    this.scrollTrigger = ScrollTrigger.create({
      trigger: this.container,
      start: '25% bottom',
      end: 'center top',
      onEnter: () => {
        self.isScrollPaused = false;
        self.startOrResumeRotation();
      },
      onLeave: () => {
        self.isScrollPaused = true;
        self.pause();
        self.pauseAllVideos();
      },
      onEnterBack: () => {
        self.isScrollPaused = false;
        self.startOrResumeRotation();
      },
      onLeaveBack: () => {
        self.isScrollPaused = true;
        self.pause();
        self.pauseAllVideos();
      },
      onRefresh: () => {
        self.checkInitialVisibility();
      },
    });

    this.checkInitialVisibility();
  };

  TabRotator.prototype.checkInitialVisibility = function () {
    if (this.scrollTrigger) {
      const progress = this.scrollTrigger.progress;
      if (progress >= 0 && progress <= 1 && this.scrollTrigger.isActive) {
        this.isScrollPaused = false;
        this.startOrResumeRotation();
      }
    }
  };

  TabRotator.prototype.startOrResumeRotation = function () {
    if (this.isHoverPaused) return;

    if (!this.hasStarted) {
      this.hasStarted = true;
      this.isPaused = false;
      this.playCurrentVideo(true);
      this.startRotation();
    } else if (this.isPaused) {
      this.playCurrentVideo(false);
      this.resume();
    }
  };

  // -----------------------------------------------------------
  // PROGRESS LINE CONTROL
  // -----------------------------------------------------------
  TabRotator.prototype.initializeProgressLines = function () {
    const allProgressLines = this.container.querySelectorAll('[brix-progress-line]');
    allProgressLines.forEach((line) => {
      line.style.transition = 'none';
      line.style.width = '0%';
      line.offsetHeight;
    });
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

  // -----------------------------------------------------------
  // TAB CONTROL AND ROTATION
  // -----------------------------------------------------------
  TabRotator.prototype.findCurrentIndex = function () {
    this.previousIndex = this.currentIndex;

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

    if (this.previousIndex !== this.currentIndex && this.previousIndex !== -1 && this.hasStarted) {
      setTimeout(() => {
        this.resetAllVideos();
      }, 0);
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
    }, 0);
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
    this.isTabSwitching = true;

    if (clickedIndex !== null) {
      this.previousIndex = this.currentIndex;
      this.currentIndex = clickedIndex;
      this.resetAllVideos();

      setTimeout(() => {
        if (!this.isScrollPaused && !this.isHoverPaused) {
          this.hasStarted = true;
          this.isPaused = false;
          setTimeout(() => {
            this.playCurrentVideo(true);
            this.isTabSwitching = false;
          }, 0);
          this.startRotation();
        } else if (!this.isScrollPaused) {
          setTimeout(() => {
            this.playCurrentVideo(true);
            this.isTabSwitching = false;
          }, 0);
        }
      }, 0);
    } else {
      setTimeout(() => {
        this.findCurrentIndexWithRetry();
      }, 0);
    }
  };

  TabRotator.prototype.startRotation = function () {
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
        setTimeout(() => {
          this.playCurrentVideo(true);
        }, 0);
        this.startRotation();
      }, 0);
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
        setTimeout(() => {
          this.playCurrentVideo(true);
        }, 0);
        this.startRotation();
      }, 0);
    }, remainingTime);
  };

  TabRotator.prototype.destroy = function () {
    clearTimeout(this.timer);
    this.pauseAllVideos();
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
      let containerDefaultSpeed = 5000;
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
