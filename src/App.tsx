import { useEffect } from "preact/hooks";
import { Route, Router } from 'preact-router';
import { isDarkTheme } from "./Utility/isDarkTheme";
import { lazy, Suspense } from "preact/compat";
import { createHashHistory } from "history";
import Loading from './Components/Calculator';
import { SettingProvider } from "./Components/SettingContext";
import './styles/button.css';
import './Styles/Form.css';
import './Styles/BottomPopup.css';
import ScreenService from "./Services/ScreenService";

navigator.serviceWorker.ready.then(() => {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ action: 'ready' });
    }
});
navigator.serviceWorker.addEventListener('message', (ev) => {
    if (ev.data?.type == "alert") {
        alert(ev.data?.message);
    }
});

const Calculator = lazy(() => import('./Components/Calculator'));
const OCR = lazy(() => import('./Components/OCR'));
const Check = lazy(() => import('./Components/Check'));
const Setting = lazy(() => import('./Components/Setting'));
const ASR = lazy(() => import('./Components/ASR'));
const BarcodeScanner = lazy(() => import('./Components/BarcodeScanner'));

export default function App() {
    const isDark = isDarkTheme();
    useEffect(() => {
        ScreenService.orientiationLock("portrait-primary");
    }, []);
    useEffect(() => {
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            themeColorMeta.setAttribute("content", isDark ? "#121212" : "#ffffff");
        }
    }, [isDark]);

    return (
        <SettingProvider>
            <Suspense fallback={Loading}>
                <Router history={createHashHistory() as any}>
                    <Route path="/" component={Calculator} />
                    <Route path="/ocr" component={OCR} />
                    <Route path="/check" component={Check} />
                    <Route path="/setting" component={Setting} />
                    <Route path="/asr" component={ASR} />
                    <Route path="/barcode" component={BarcodeScanner} />
                </Router>
            </Suspense>
        </SettingProvider>
    );
}
