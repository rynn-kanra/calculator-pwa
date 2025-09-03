import { createContext } from 'preact';
import { Dispatch, StateUpdater, useContext, useEffect, useState } from 'preact/hooks';
import { CalculatorConfig } from '../Model/CalculatorConfig';
import LocalDBService from '../Services/LocalDBService';
import { LocalStorageService } from '../Services/LocalStorageService';
import { ClickAudio } from '../Services/AudioService';
import ScreenService from '../Services/ScreenService';

const SettingContext = createContext<[CalculatorConfig, Dispatch<StateUpdater<CalculatorConfig>>, () => void]>([] as any);
// recover old setting
const settingService = new LocalStorageService(CalculatorConfig, "setting");
const oldsetting = settingService.get();
if (oldsetting) {
  await LocalDBService.set("setting", oldsetting);
  settingService.delete();
}
const st = await LocalDBService.get("setting");

export function SettingProvider({ children }: any) {
  const [setting, setSetting] = useState<CalculatorConfig>(st);

  useEffect(() => {
    (async () => {
      if (st.sound) {
        await ClickAudio.init();
      }
    })();
    if (setting.keepScreenAwake !== false) {
      ScreenService.keepScreenAwake();
    }
  }, [setting]);
  return (
    <SettingContext.Provider value={[
      setting,
      (d) => {
        if (typeof d === "function") {
          d = d(setting);
        }
        LocalDBService.set("setting", d);
        setSetting(d);
      },
      () => {
        if (setting.vibrate) {
          try {
            navigator.vibrate?.(30); // vibrate for 30 milliseconds
          } catch { }
        }
  
        if (setting.sound) {
          ClickAudio.play();
        }    
      }
    ]}>
      {children}
    </SettingContext.Provider>
  );
}

export function useSetting() {
  return useContext(SettingContext);
}
