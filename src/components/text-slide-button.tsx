import React, { useRef, useEffect } from "react";
import "./text-slide-button.css";
import gsap from "gsap";
import CustomEase from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);

interface TextSlideButtonProps {
  text: string;
  onClick?: () => void;
  color: string;
  textColor: string;
  className?: string;
  secondaryColor?: string;
  secondaryTextColor?: string;
}

export default function TextSlideButton({
  text,
  onClick,
  color,
  textColor,
  className,
  secondaryColor = textColor,
  secondaryTextColor = color
}: TextSlideButtonProps) {
  const btnRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const duplicateTextRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    CustomEase.create("smoothEase", "0.87, 0, 0.13, 1");
    const btn = btnRef.current;
    const bg = bgRef.current;
    const textEl = textRef.current;
    const dupTextEl = duplicateTextRef.current;

    if (!btn || !bg || !textEl || !dupTextEl) return;

    const handleEnter = () => {
      // BG animation
      gsap.fromTo(
        bg,
        { clipPath: "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.3,
          ease: "power3.inOut"
        }
      );

      // Text animation
      const height = textEl.offsetHeight;

      gsap.to(textEl, {
        y: -height,
        duration: 0.3,
        ease: "power3.inOut",
      });

      gsap.to(dupTextEl, {
        y: -height,
        duration: 0.3,
        ease: "power3.inOut",
      });
    };

    const handleLeave = () => {
      // BG animation
      gsap.to(bg, {
        clipPath: "inset(100% 0% 0% 0%)",
        duration: 0.3,
        ease: "power3.inOut"
      });

      // Text animation reset
      gsap.to([textEl, dupTextEl], {
        y: 0,
        duration: 0.3,
        ease: "power3.inOut",
      });
    };

    btn.addEventListener("mouseenter", handleEnter);
    btn.addEventListener("mouseleave", handleLeave);

    return () => {
      btn.removeEventListener("mouseenter", handleEnter);
      btn.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <div className={`btn-slide ${className || ""}`} ref={btnRef}>
      <button 
        onClick={onClick} 
        style={{ 
          background: color,
          width: className?.includes('w-full') ? '100%' : 'auto'
        }}
      >
        <div className="texts-btn">
          <span
            id="text-btn"
            ref={textRef}
            style={{ color: textColor }}
          >
            {text}
          </span>
          <span
            id="text-btn-duplicate"
            ref={duplicateTextRef}
            style={{ color: secondaryTextColor }}
          >
            {text}
          </span>
        </div>
        <div
          ref={bgRef}
          style={{
            background: secondaryColor,
            clipPath: "inset(100% 0% 0% 0%)"
          }}
          className="bg-slide"
        ></div>
      </button>
    </div>
  );
}
