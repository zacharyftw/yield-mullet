"use client";

import { Shuffle } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const navLinks = [
  { label: "Strategy", href: "#strategy" },
  { label: "Dashboard", href: "#dashboard" },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <Shuffle className="h-5 w-5 text-foreground" />
          <span className="text-lg font-bold text-foreground">
            Yield Mullet
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Connect button */}
        <ConnectButton
          chainStatus="icon"
          showBalance={false}
          accountStatus="address"
        />
      </div>
    </nav>
  );
}
