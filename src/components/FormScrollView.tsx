import { useImperativeHandle, useRef, type ReactNode, type Ref } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TextInput,
  type ScrollViewInstance,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

// Space kept under the focused text line: the rest of its box, a two-line error, and a little air.
const FIELD_REVEAL_OFFSET = 64;

export type FormScrollViewHandle = {
  revealFocusedField: () => void;
  scrollToTop: () => void;
};

type FormScrollViewProps = {
  children: ReactNode;
  // Distance from the top of the window to this scroll view, e.g. a fixed header above it.
  topOffset?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  ref?: Ref<FormScrollViewHandle>;
};

export function FormScrollView({
  children,
  topOffset = 0,
  contentContainerStyle,
  ref,
}: FormScrollViewProps) {
  const scrollRef = useRef<ScrollViewInstance>(null);

  // Android's own scroll-to-input is unreliable (text line only, or nothing on smaller phones), so do it here.
  function revealFocusedField() {
    const input = TextInput.State.currentlyFocusedInput();
    if (input && Keyboard.isVisible()) {
      scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(
        input,
        FIELD_REVEAL_OFFSET + topOffset,
        true,
      );
    }
  }

  function handleKeyboardResize() {
    revealFocusedField();
    // A second pass lands after Android's own smooth scroll, which can finish last when animations are shortened.
    setTimeout(revealFocusedField, 300);
  }

  useImperativeHandle(ref, () => ({
    revealFocusedField,
    scrollToTop: () => scrollRef.current?.scrollTo({ y: 0, animated: true }),
  }));

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.flex}>
      <ScrollView
        ref={scrollRef}
        onLayout={handleKeyboardResize}
        onContentSizeChange={revealFocusedField}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
