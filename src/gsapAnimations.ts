import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ExpoScaleEase } from 'gsap/EasePack'
import { type PerspectiveCamera } from 'three'
gsap.registerPlugin(ScrollTrigger, ExpoScaleEase)

export const sectionScrollAnimation = (
  triggerClass: string,
  AnimatedElementClass: string,
) => {
  const tl = gsap.timeline({
    scrollTrigger: {
      // scrub: 1,
      trigger: `.${triggerClass}`,
      start: 'top 50%',
      end: 'bottom bottom',
      //onLeaveBack: () => tl.reverse(),
      /*markers: {
        startColor: 'green',
        endColor: 'red',
      },*/
    },
  })

  return tl.from(`.${AnimatedElementClass}`, {
    opacity: 0,
    y: 100,
    duration: 1,
    stagger: 0.3,
  })
}
gsap.set(`.show-fixed-cta-on-scroll`, { opacity: 0 })
export const showCtaOnScroll = (triggerClass: string) => {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: `.${triggerClass}`,
      start: 'top 40%',
      end: 'bottom bottom',
      onLeaveBack: () => tl.reverse(),
      /*markers: {
        startColor: 'green',
        endColor: 'red',
      },*/
    },
  })
  return tl.to(`.show-fixed-cta-on-scroll`, {
    opacity: 1,
  })
}
export const animateBackgroundOnScroll = (
  triggerClass: string,
  camera: PerspectiveCamera,
) => {
  const tl = gsap.timeline({
    scrollTrigger: {
      //scrub: 1,
      trigger: `.${triggerClass}`,
      start: 'top 70%',
      end: 'bottom bottom',
      // onEnter: () => camera.translateZ(-20),
      onLeaveBack: () => tl.reverse(),
      /*markers: {
        startColor: 'green',
        endColor: 'red',
      },*/
    },
  })
  // gsap.set(`.show-fixed-cta-on-scroll`, { opacity: 0 })
  return tl.to(camera.position, {
    z: -5,
  })
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
      onLeaveBack: () => tl.reverse(),
      /*markers: {
        startColor: 'green',
        endColor: 'red',
      },*/
    },
  })

  tl.to(`.${AnimatedElementClass}`, {
    strokeDashoffset: offset,
    duration: 2.5,
    ease: 'expo.inOut',
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
    duration: 1.5,
    delay: Number(delay) / 5,
  })
}
export const percentagesOnHideAnimation = (animationClass: string) => {
  return gsap.timeline().to(`.${animationClass}`, {
    strokeDashoffset: 240,
  })
}
