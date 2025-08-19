"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

export default function ScrollAnimation() {
	const containerRef = useRef<HTMLDivElement>(null);
	const bannerRef = useRef<HTMLDivElement>(null);
	const maskLayersRef = useRef<HTMLDivElement[]>([]);
	const introTextRef = useRef<HTMLDivElement[]>([]);
	const headerRef = useRef<HTMLHeadingElement>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;

		gsap.registerPlugin(ScrollTrigger);

		const lenis = new Lenis({
			duration: 1.2,
			easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
		});

		function raf(time: number) {
			lenis.raf(time);
			requestAnimationFrame(raf);
		}
		requestAnimationFrame(raf);

		lenis.on("scroll", ScrollTrigger.update);

		const maskLayers = maskLayersRef.current.filter(Boolean);
		const introTexts = introTextRef.current.filter(Boolean);

		maskLayers.forEach((layer, i) => {
			gsap.set(layer, { scale: 0.9 - i * 0.15 });
		});

		if (bannerRef.current) {
			gsap.set(bannerRef.current, { scale: 0 });
		}

		let words: HTMLElement[] = [];
		if (headerRef.current) {
			const text = headerRef.current.textContent || "";
			headerRef.current.innerHTML = text
				.split(" ")
				.map((word) => `<span class="word">${word}</span>`)
				.join(" ");
			words = Array.from(headerRef.current.querySelectorAll(".word"));
			gsap.set(words, { opacity: 0 });
		}

		const scrollTrigger = ScrollTrigger.create({
			trigger: ".banner-section",
			start: "top top",
			end: `+=${window.innerHeight * 4}px`,
			pin: true,
			pinSpacing: true,
			scrub: 1,
			onUpdate: (self) => {
				const progress = self.progress;

				if (bannerRef.current) {
					gsap.set(bannerRef.current, { scale: progress });
				}

				maskLayers.forEach((layer, i) => {
					const initialScale = 0.9 - i * 0.15;
					const layerProgress = Math.min(progress / 0.9, 1.0);
					const currentScale = initialScale + layerProgress * (1.0 - initialScale);
					gsap.set(layer, { scale: currentScale });
				});

				if (progress <= 0.9 && introTexts.length >= 2) {
					const textProgress = progress / 0.9;
					const moveDistance = window.innerWidth * 0.5;

					gsap.set(introTexts[0], {
						x: -textProgress * moveDistance,
					});
					gsap.set(introTexts[1], {
						x: textProgress * moveDistance,
					});
				}

				if (progress >= 0.7 && progress <= 0.9) {
					const headerProgress = (progress - 0.7) / 0.2;
					const totalWords = words.length;

					words.forEach((word, i) => {
						const wordStartDelay = i / totalWords;
						const wordEndDelay = (i + 1) / totalWords;

						let wordOpacity = 0;

						if (headerProgress >= wordEndDelay) {
							wordOpacity = 1;
						} else if (headerProgress >= wordStartDelay) {
							const wordProgress =
								(headerProgress - wordStartDelay) / (wordEndDelay - wordStartDelay);
							wordOpacity = wordProgress;
						}

						gsap.set(word, { opacity: wordOpacity });
					});
				} else if (progress < 0.7) {
					gsap.set(words, { opacity: 0 });
				} else if (progress > 0.9) {
					gsap.set(words, { opacity: 1 });
				}
			},
		});

		return () => {
			scrollTrigger.kill();
			lenis.destroy();
		};
	}, []);

	const addToMaskRefs = (el: HTMLDivElement) => {
		if (el && !maskLayersRef.current.includes(el)) {
			maskLayersRef.current.push(el);
		}
	};

	const addToIntroRefs = (el: HTMLDivElement) => {
		if (el && !introTextRef.current.includes(el)) {
			introTextRef.current.push(el);
		}
	};

	return (
		<div ref={containerRef}>
			<section className="hero-section relative w-full h-screen bg-[#e3e3db] text-[#141414] flex items-center justify-center overflow-hidden">
				<h1 className="text-6xl md:text-8xl font-serif text-center w-4/5 leading-tight">
					Ship Projects. Get to Japan.
				</h1>
			</section>

			<section className="banner-section relative w-full h-screen bg-[#e3e3db] text-[#141414] overflow-hidden">
				<div
					ref={bannerRef}
					className="banner-img-container relative w-full h-full"
					style={{ willChange: "transform" }}
				>
					<div className="absolute inset-0 w-full h-full">
						<img
							src="/sakura-banner.png"
							alt="Sakura"
							className="w-full h-full object-cover"
							style={{ willChange: "transform" }}
						/>
					</div>

					{[...Array(6)].map((_, i) => (
						<div
							key={i}
							ref={addToMaskRefs}
							className="absolute inset-0 w-full h-full mask-layer"
							style={{
								WebkitMaskImage: "url('/sakura-mask.png')",
								maskImage: "url('/sakura-mask.png')",
								WebkitMaskSize: "cover",
								maskSize: "cover",
								WebkitMaskPosition: "center",
								maskPosition: "center",
								willChange: "transform",
							}}
						>
							<img
								src="/sakura-banner.png"
								alt="Sakura"
								className="w-full h-full object-cover"
								style={{ willChange: "transform" }}
							/>
						</div>
					))}

					<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 text-center z-20">
						<h1
							ref={headerRef}
							className="text-4xl md:text-6xl font-serif text-[#e3e3db] leading-tight"
						>
							Sakura
						</h1>
					</div>
				</div>

				<div className="absolute top-1/2 transform -translate-y-1/2 w-full flex gap-2 z-30 pointer-events-none">
					<div
						ref={addToIntroRefs}
						className="flex-1 flex justify-end"
						style={{ willChange: "transform" }}
					>
						<h1 className="text-4xl md:text-6xl font-serif text-[#141414]">
							Build
						</h1>
					</div>
					<div
						ref={addToIntroRefs}
						className="flex-1 flex justify-start"
						style={{ willChange: "transform" }}
					>
						<h1 className="text-4xl md:text-6xl font-serif text-[#141414]">
							Ship
						</h1>
					</div>
				</div>
			</section>

			<section className="outro-section relative w-full h-screen bg-[#e3e3db] text-[#141414] flex items-center justify-center overflow-hidden">
				<h1 className="text-6xl md:text-8xl font-serif text-center w-4/5 leading-tight">
					An upcoming hackclub event at Japan.
				</h1>
			</section>
		</div>
	);
}
