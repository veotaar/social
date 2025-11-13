import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const themes = {
  dark: "dracula",
  light: "nord",
} as const;

const ThemeController = () => {
  const [isdark, setIsdark] = useState<boolean>(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "light") {
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (isdark) {
      document.documentElement.dataset.theme = themes.dark;
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.dataset.theme = themes.light;
      localStorage.setItem("theme", "light");
    }
  }, [isdark]);
  return (
    <label className="flex cursor-pointer gap-2">
      <Sun />
      <input
        type="checkbox"
        value={isdark ? themes.dark : themes.light}
        checked={isdark}
        onChange={() => setIsdark(!isdark)}
        className="toggle theme-controller"
      />
      <Moon />
    </label>
  );
};

export default ThemeController;
