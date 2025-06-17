'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { motionAllowed } from '@/lib/motion';
import { useSiteStore } from '@/store/useSiteStore';

export default function HeroSection() {
  const tagRef = useRef<HTMLParagraphElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const roleRef = useRef<HTMLParagraphElement>(null);
  const scrollRef = useRef<HTMLParagraphElement>(null);

  // Entrance timeline — fires once, when the loading screen releases isLoading
  useEffect(() => {
    const unsubscribe = useSiteStore.subscribe(
      (state) => state.isLoading,
      (isLoading) => {
        if (!isLoading) {
          if (motionAllowed()) {
            const tl = gsap.timeline({ delay: 0.2 });
            tl.fromTo(
              tagRef.current,
              { opacity: 0, y: -8 },
              { opacity: 0.7, y: 0, duration: 0.5, ease: 'power2.out' }
            )
              .fromTo(
                nameRef.current,
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' },
                '-=0.2'
              )
              .fromTo(
                roleRef.current,
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
                '-=0.3'
              )
              .fromTo(
                scrollRef.current,
                { opacity: 0 },
                { opacity: 0.4, duration: 0.5, ease: 'power2.out' },
                '-=0.1'
              );
          } else {
            gsap.set([tagRef.current, nameRef.current, roleRef.current], { opacity: 1 });
            gsap.set(scrollRef.current, { opacity: 0.4 });
          }
          unsubscribe();
        }
      }
    );
    return () => unsubscribe();
  }, []);

  // Scroll prompt fades out as soon as the visitor starts scrolling —
  // a separate effect that lives for the whole component lifetime
  useEffect(() => {
    const unsubscribe = useSiteStore.subscribe(
      (state) => state.scrollT,
      (scrollT) => {
        if (scrollT > 0.02 && scrollRef.current) {
          scrollRef.current.style.animation = 'none';
          if (motionAllowed()) {
            gsap.to(scrollRef.current, { opacity: 0, duration: 0.3, ease: 'power2.out' });
          } else {
            scrollRef.current.style.opacity = '0';
          }
        }
      }
    );
    return () => unsubscribe();
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '800px', // matches HEADER_HEIGHT_PX — hardcoded to avoid coupling
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        pointerEvents: 'none',
      }}
    >
      <div style={{ maxWidth: '600px', textAlign: 'center' }}>
        <p
          ref={tagRef}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#00FFEE',
            opacity: 0,
          }}
        >
          — SIGNAL RECEIVED —
        </p>
        <h1
          ref={nameRef}
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 300,
            fontSize: 'clamp(36px, 5vw, 52px)',
            color: 'var(--color-text-primary)',
            marginTop: '16px',
            opacity: 0,
          }}
        >
          Sidakpreet Singh
        </h1>
        <p
          ref={roleRef}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            letterSpacing: '0.15em',
            color: 'var(--color-text-secondary)',
            marginTop: '16px',
            opacity: 0,
          }}
        >
          Strategy & GTM · HCLSoftware · IIM Indore
        </p>
        <p
          ref={scrollRef}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.2em',
            color: 'var(--color-text-muted)',
            marginTop: '24px',
            opacity: 0,
            animation: 'pulse-opacity 2s ease-in-out infinite',
          }}
        >
          scroll to descend ↓
        </p>
      </div>
    </div>
  );
}
