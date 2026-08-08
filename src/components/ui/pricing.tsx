"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

export function Pricing({
  plans,
  title = "Simple, transparent pricing",
  description = "Pick a plan that matches your server size.\nEvery plan includes the web dashboard, live embed studio, and Discord OAuth.",
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const switchRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: ["#d4a574", "#e8c09a", "#3d9b8f", "#f4f0ea"],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-6 py-20">
      <div className="mb-12 space-y-4 text-center">
        <h2 className="font-display text-4xl font-bold tracking-tight text-cream sm:text-5xl">
          {title}
        </h2>
        <p className="whitespace-pre-line text-lg text-muted">{description}</p>
      </div>

      <div className="mb-10 flex items-center justify-center gap-2">
        <Label className="relative inline-flex cursor-pointer items-center">
          <Switch
            ref={switchRef}
            checked={!isMonthly}
            onCheckedChange={handleToggle}
            className="relative"
          />
        </Label>
        <span className="font-semibold text-cream">
          Annual billing{" "}
          <span className="text-copper">(Save 20%)</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ y: 50, opacity: 0 }}
            whileInView={
              isDesktop
                ? {
                    y: plan.isPopular ? -20 : 0,
                    opacity: 1,
                    x: index === 2 ? -30 : index === 0 ? 30 : 0,
                    scale: index === 0 || index === 2 ? 0.94 : 1.0,
                  }
                : { y: 0, opacity: 1 }
            }
            viewport={{ once: true }}
            transition={{
              duration: 1.2,
              type: "spring",
              stiffness: 100,
              damping: 30,
              delay: 0.15 * index,
            }}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-surface p-6 text-center lg:justify-center",
              plan.isPopular ? "border-copper border-2" : "border-line",
              !plan.isPopular && "mt-5",
              index === 0 && "origin-right",
              index === 2 && "origin-left"
            )}
          >
            {plan.isPopular ? (
              <div className="absolute right-0 top-0 flex items-center rounded-bl-xl rounded-tr-xl bg-copper px-2 py-0.5">
                <Star className="h-4 w-4 fill-current text-ink" />
                <span className="ml-1 text-sm font-semibold text-ink">
                  Popular
                </span>
              </div>
            ) : null}

            <div className="flex flex-1 flex-col">
              <p className="text-base font-semibold text-muted">{plan.name}</p>
              <div className="mt-6 flex items-center justify-center gap-x-2">
                <span className="font-display text-5xl font-bold tracking-tight text-cream">
                  <NumberFlow
                    value={
                      isMonthly ? Number(plan.price) : Number(plan.yearlyPrice)
                    }
                    format={{
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }}
                    transformTiming={{
                      duration: 500,
                      easing: "ease-out",
                    }}
                    willChange
                    className="tabular-nums"
                  />
                </span>
                {plan.period !== "Next 3 months" ? (
                  <span className="text-sm font-semibold leading-6 tracking-wide text-muted">
                    / {plan.period}
                  </span>
                ) : null}
              </div>

              <p className="text-xs leading-5 text-muted">
                {isMonthly ? "billed monthly" : "billed annually"}
              </p>

              <ul className="mt-5 flex flex-col gap-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-copper" />
                    <span className="text-left text-sm text-cream/90">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <hr className="my-4 w-full border-line" />

              <Link
                href={plan.href}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter",
                  "transform-gpu transition-all duration-300 ease-out hover:ring-2 hover:ring-copper hover:ring-offset-1 hover:ring-offset-ink",
                  plan.isPopular
                    ? "border-transparent bg-copper text-ink hover:bg-copper-bright"
                    : "border-line bg-ink text-cream hover:border-copper/50 hover:bg-surface-2"
                )}
              >
                {plan.buttonText}
              </Link>
              <p className="mt-6 text-xs leading-5 text-muted">
                {plan.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
