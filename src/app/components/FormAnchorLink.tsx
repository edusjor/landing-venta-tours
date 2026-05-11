"use client";

import React from "react";

type FormAnchorLinkProps = {
  className?: string;
  children: React.ReactNode;
};

export default function FormAnchorLink({ className, children }: FormAnchorLinkProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    const target = document.getElementById("formulario-contacto");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (window.location.hash !== "#formulario-contacto") {
        window.history.pushState(null, "", "#formulario-contacto");
      }
      return;
    }

    window.location.href = "/#formulario-contacto";
  };

  return (
    <a href="/#formulario-contacto" onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
