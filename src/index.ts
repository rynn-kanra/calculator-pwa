import { h, render } from "preact";
import App from "./App";
import { CalcParser } from "./Services/MathLanguageParser";

window.matht = CalcParser;
render(h(App, null), document.getElementById('app')!);
