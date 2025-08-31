import { FunctionalComponent } from 'preact';
import { JSXInternal } from 'preact/src/jsx';

export interface BottomPopupProps {
  isOpen: boolean;
  onClose?: () => void;
  hideClose?: boolean;
  contentStyle?: JSXInternal.Signalish<string | JSXInternal.CSSProperties | undefined>,
  children: preact.ComponentChildren;
}

const BottomPopup: FunctionalComponent<BottomPopupProps> = ({ isOpen, onClose, hideClose, contentStyle, children }) => {
  if (!isOpen) return null;

  return (
    <div class="popup-backdrop" onClick={onClose}>
      <div class="popup-content" style={contentStyle} onClick={e => e.stopPropagation()}>
        {!hideClose && (<button class="close-btn" onClick={onClose}>×</button>)}
        {children}
      </div>
    </div>
  );
};

export default BottomPopup;
