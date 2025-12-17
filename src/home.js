import { gsap } from 'gsap';
import { Observer } from 'gsap/Observer';
import { SplitText } from 'gsap/SplitText';
gsap.registerPlugin(Observer, SplitText);

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
  // SUCCESS STORIES SWIPER //
  // -----------------------------------------------------------

  // -----------------------------------------------------------
  // TAB SYSTEM SCRIPT //
  // -----------------------------------------------------------

  /**
   * BRIX AutoTabs for Webflow
   * ----------------------------------------------------------------------------
   * Enhance your Webflow tabs with automatic rotation while maintaining
   * native transitions and user control. Core features include:
   *
   *  • Per-tab customizable rotation speeds
   *  • Smart hover-pause functionality (enabled by default)
   *  • Preserved Webflow transitions via click simulation
   *  • Simple configuration through custom attributes
   *
   * Implementation Guide
   * ----------------------------------------------------------------------------
   *  1. Enable rotation by adding brix-autotabs="true" to your Tabs wrapper
   *     (the element containing .w-tab-menu and .w-tab-content)
   *
   *  2. Customize individual tab timing with brix-autotabs-speed="XXXX"
   *     on any .w-tab-link element (defaults to 5000ms if not specified)
   *
   *  3. Optionally disable hover-pause by adding brix-autotabs-pauseable="false"
   *     to your Tabs wrapper (not recommended for text-heavy content)
   *
   *  Version: 1.2.0
   *  For documentation and support: https://brixtemplates.com
   */

  (function () {
    'use strict';

    /**
     * parseBracketsAndLog
     * Splits a string into bracketed segments and styles them in bold.
     * Example: "Default speed: [5000ms]" => "Default speed: 5000ms" in the console, with '5000ms' in bold.
     */
    function parseBracketsAndLog(line) {
      // Split into segments: text outside brackets, plus bracketed text
      const segments = line.split(/(\[[^\]]+\])/g);
      const output = [];
      const styles = [];

      segments.forEach((segment) => {
        if (!segment) return;
        if (segment.startsWith('[') && segment.endsWith(']')) {
          // Remove brackets, apply bold styling
          const text = segment.slice(1, -1);
          output.push(`%c${text}`);
          styles.push('font-weight: bold;');
        } else {
          // Normal text
          output.push(`%c${segment}`);
          styles.push('font-weight: normal;');
        }
      });

      // Merge into a single console.log call
      console.log(output.join(''), ...styles);
    }

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

      if (!this.tabLinks.length) {
        console.warn(
          '[BRIX AutoTabs] Warning: No tabs found inside this container. Rotation skipped.'
        );
        return;
      }

      this.init();
    }

    TabRotator.prototype.init = function () {
      this.findCurrentIndex();
      this.setupEventListeners();
      this.startRotation();
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
      // If no active tab found, force the first tab to be active
      if (!foundActive && this.tabLinks[0]) {
        this.currentIndex = 0;
        this.simulateClick(this.tabLinks[0]);
      }
    };

    TabRotator.prototype.setupEventListeners = function () {
      const self = this;
      // Hover/touch pause
      if (this.pauseable) {
        this.container.addEventListener('mouseenter', () => self.pause());
        this.container.addEventListener('mouseleave', () => self.resume());
        this.container.addEventListener('touchstart', () => self.pause(), { passive: true });
        this.container.addEventListener('touchend', () => self.resume(), { passive: true });
        this.container.addEventListener('touchcancel', () => self.resume(), { passive: true });
      }

      // Manual interactions
      this.tabLinks.forEach((link) => {
        link.addEventListener('click', () => self.resetAfterManualInteraction());
        link.addEventListener('focus', () => self.resetAfterManualInteraction());
      });
    };

    TabRotator.prototype.resetAfterManualInteraction = function () {
      clearTimeout(this.timer);
      this.timer = null;

      setTimeout(() => {
        this.findCurrentIndex();
        this.startRotation();
      }, 150);
    };

    TabRotator.prototype.startRotation = function () {
      if (this.isPaused) return;
      clearTimeout(this.timer);

      const currentLink = this.tabLinks[this.currentIndex];
      const speedAttr = currentLink.getAttribute('brix-autotabs-speed');
      let speed = parseInt(speedAttr, 10);

      if (isNaN(speed) || speed <= 0) {
        if (speedAttr !== null) {
          console.warn(
            `[BRIX AutoTabs] Invalid speed '${speedAttr}' on tab index ${this.currentIndex}. Using default of ${this.defaultSpeed}ms.`
          );
        }
        speed = this.defaultSpeed;
      }

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
    };

    TabRotator.prototype.resume = function () {
      if (!this.isPaused) return;
      this.isPaused = false;
      this.startRotation();
    };

    // -----------------------------------------------------------
    // Initialization on DOM load
    // -----------------------------------------------------------
    function initBrixAutoTabs() {
      const containers = document.querySelectorAll('[brix-autotabs="true"]');
      if (!containers.length) return;

      parseBracketsAndLog('------------------------------------------------');
      parseBracketsAndLog(
        '[AutoTabs] by [BRIX Templates] initialized successfully with the following settings:'
      );
      parseBracketsAndLog('');

      containers.forEach((container, index) => {
        // Check if pauseable
        const pauseableAttr = container.getAttribute('brix-autotabs-pauseable');
        let isPauseable = true;
        if (pauseableAttr && pauseableAttr.toLowerCase() === 'false') {
          isPauseable = false;
        }

        // Container default speed
        const defaultSpeedAttr = container.getAttribute('brix-autotabs-default-speed');
        let containerDefaultSpeed = 5000;
        if (defaultSpeedAttr) {
          const parsed = parseInt(defaultSpeedAttr, 10);
          if (!isNaN(parsed) && parsed > 0) {
            containerDefaultSpeed = parsed;
          } else {
            console.warn(
              `[BRIX AutoTabs] brix-autotabs-default-speed="${defaultSpeedAttr}" is invalid. Using 5000ms fallback.`
            );
          }
        }

        const links = container.querySelectorAll('.w-tab-link');
        const subCount = links.length;

        // Initialize rotator
        new TabRotator(container, {
          pauseable: isPauseable,
          containerSpeed: containerDefaultSpeed,
        });

        // Collect custom speeds
        const customSpeeds = [];
        links.forEach((link, linkIndex) => {
          const spd = link.getAttribute('brix-autotabs-speed');
          if (spd && parseInt(spd, 10) > 0) {
            customSpeeds.push(`Tab [${linkIndex + 1}] set to [${spd}ms]`);
          }
        });

        parseBracketsAndLog(`Tab [${index + 1}] has [${subCount}] sections with:`);
        parseBracketsAndLog(`  • Pause on hover: ${isPauseable ? 'enabled' : 'disabled'}`);
        parseBracketsAndLog(`  • Default base rotation: [${containerDefaultSpeed}ms]`);

        if (!customSpeeds.length) {
          parseBracketsAndLog('  • Custom rotation speed: none (all tabs use default speed)');
          parseBracketsAndLog('');
        } else if (customSpeeds.length === 1) {
          parseBracketsAndLog(
            `  • Custom rotation speed: ${customSpeeds[0]}, all others using default speed of [${containerDefaultSpeed}ms]`
          );
          parseBracketsAndLog('');
        } else {
          parseBracketsAndLog(
            `  • Custom rotation speed: ${customSpeeds.join(', ')}\n    all others using default speed of [${containerDefaultSpeed}ms]`
          );
          parseBracketsAndLog('');
        }
      });

      parseBracketsAndLog(
        'Need to make changes? Just head to Element Settings in your Webflow designer.'
      );
      parseBracketsAndLog(
        'For tips and detailed configuration options, visit brixtemplates.com/blog'
      );
      parseBracketsAndLog('------------------------------------------------');
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initBrixAutoTabs);
    } else {
      initBrixAutoTabs();
    }
  })();

  // -----------------------------------------------------------
  // TAB SYSTEM SCRIPT //
  // -----------------------------------------------------------
});
