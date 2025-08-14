import { useEffect } from "preact/hooks";
import { Calculator } from "./Components/Calculator";
import { isDarkTheme } from "./Utility/isDarkTheme";

export default function App() {
    const isDark = isDarkTheme();
    useEffect(() => {
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            themeColorMeta.setAttribute("content", isDark ? "#121212" : "#ffffff");
        }
    }, [isDark]);

    return (
        <Calculator />
    );
}