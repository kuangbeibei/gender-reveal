"use client";

import { useEffect, useState } from "react";
import GenderReveal from "../components/GenderReveal";

export default function Page() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/result", { method: "GET" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const mapped = data.fetalSex.toLowerCase() === "male" ? "boy" : "girl";
          window.localStorage.setItem("result", mapped);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;
  return <GenderReveal />;
}
