import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ExpoScaleEase } from 'gsap/EasePack'
import { type PerspectiveCamera } from 'three'
gsap.registerPlugin(ScrollTrigger, ExpoScaleEase)

// Helper to detect mobile devices
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
}

export const sectionScrollAnimation = (
  triggerClass: string,
  AnimatedElementClass: string,
) => {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: `.${triggerClass}`,
      start: 'top 50%',
      end: 'bottom bottom',
      // Play once and stay in final state
      toggleActions: 'play none none none',
      once: true,
      fastScrollEnd: true,
    },
  })

  return tl.from(`.${AnimatedElementClass}`, {
    opacity: 0,
    y: 100,
    duration: 1,
    stagger: 0.3,
    ease: "power2.out",
  })
}

gsap.set(`.show-fixed-cta-on-scroll`, { opacity: 0 })
export const showCtaOnScroll = (triggerClass: string) => {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: `.${triggerClass}`,
      start: 'top 40%',
      end: 'bottom bottom',
      // Allow the CTA to show/hide when scrolling up/down, just like the background
      onLeaveBack: () => tl.reverse(),
      fastScrollEnd: true,
    },
  })
  return tl.to(`.show-fixed-cta-on-scroll`, {
    opacity: 1,
    duration: 0.8, // Longer duration like the original
    ease: "power3.inOut", // Smoother, more pronounced easing
  })
}

export const animateBackgroundOnScroll = (
  triggerClass: string,
  camera: PerspectiveCamera,
) => {
  // Fixed zoom values
  const zoomedOutZ = 30;  // Initial zoomed out position
  const zoomedInZ = -5; // Final zoomed in position
  
  if (isMobile()) {
    // Simple direct approach for mobile
    // Start with camera zoomed out
    camera.position.z = zoomedOutZ;
    camera.updateMatrixWorld(true);
    
    // Create a simple timeline that directly controls Z position based on scroll
    return gsap.timeline({
      scrollTrigger: {
        trigger: `.${triggerClass}`,
        start: 'top 95%',
        end: '+=600',
        scrub: 0.5, // Changed from true to 0.5 for smoother mobile scrolling
        pin: false,
        anticipatePin: false,
        invalidateOnRefresh: true,
        onEnter: () => {
          console.log("Trigger entered");
        },
        onLeave: () => {
          console.log("Trigger left");
        },
        onEnterBack: () => {
          console.log("Trigger entered from below");
        },
        onLeaveBack: () => {
          console.log("Trigger left from below");
        },
        onUpdate: (self) => {
          // Direct control: position is directly calculated from scroll progress
          const newZ = zoomedOutZ + self.progress * (zoomedInZ - zoomedOutZ);
          camera.position.z = newZ;
          camera.updateMatrixWorld(true);
          console.log("Progress:", self.progress, "Z:", newZ);
        }
      }
    });
  } else {
    // For desktop: smooth scroll-based animation (unchanged)
    return gsap.timeline({
      scrollTrigger: {
        trigger: `.${triggerClass}`,
        start: 'top 70%',
        end: 'bottom bottom',
        scrub: 0.5, // Smooth scrubbing for desktop
        fastScrollEnd: true,
      }
    }).to(camera.position, {
      z: -5,
      ease: "none",
      onUpdate: () => {
        camera.updateMatrixWorld(true);
      }
    });
  }
}


export const percentagesScrollAnimation = (
  triggerClass: string,
  AnimatedElementClass: string,
  offset: string | undefined,
  delay: string | undefined,
) => {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: `.${triggerClass}`,
      start: 'top 40%',
      end: 'bottom bottom',
      // Play once and stay in final state
      toggleActions: 'play none none none',
      once: true,
      fastScrollEnd: true,
    },
  })

  tl.to(`.${AnimatedElementClass}`, {
    strokeDashoffset: offset,
    duration: 2.0, // Significantly slower animation (was 1.5-2.5)
    ease: 'expo.inOut', // More dramatic easing for slower, more impressive animation
    delay: Number(delay) / 3,
  })
}

export const percentagesOnShowAnimation = (
  animationClass: string,
  offset: string | undefined,
  delay: string | undefined,
) => {
  return gsap.timeline().to(`.${animationClass}`, {
    strokeDashoffset: offset,
    ease: 'expo.inOut',
    duration: 2.0, // Slower animation (was 1-1.5)
    delay: Number(delay) / 5,
  })
}

export const percentagesOnHideAnimation = (animationClass: string) => {
  return gsap.timeline().to(`.${animationClass}`, {
    strokeDashoffset: 240,
    duration: isMobile() ? 0.5 : 0.8, // Add duration for smoother transition
    ease: "power1.inOut"
  })
}

// Add a function to optimize Three.js performance on mobile
export const optimizeThreeJSForMobile = (scene: any, renderer: any) => {
  if (isMobile()) {
    // Reduce pixel ratio for better performance
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));
    
    // Simplify shadows if applicable
    renderer.shadowMap.enabled = false;
    
    // Lower resolution or complexity
    scene.traverse((object: any) => {
      if (object.isMesh) {
        // Reduce geometry detail if possible
        if (object.geometry && object.geometry.attributes && object.geometry.attributes.position) {
          // This is just a placeholder - you would need to implement actual LOD (Level of Detail)
          // or geometry simplification based on your specific model
        }
      }
    });
  }
}
