// import { useEffect, useRef, useState } from "react";
// import { AppText, type TextTone, type TextVariant } from "./AppText";

// type Props = { value: number; variant?: TextVariant; tone?: TextTone };

// /** Ticks one step at a time toward the target, so small counts feel alive. */
// export function CountUp({
//   value,
//   variant = "displayXL",
//   tone = "default",
// }: Props) {
//   const [shown, setShown] = useState(0);
//   const shownRef = useRef(0);

//   useEffect(() => {
//     if (shownRef.current === value) return;
//     const step = value > shownRef.current ? 1 : -1;
//     const timer = setInterval(() => {
//       shownRef.current += step;
//       setShown(shownRef.current);
//       if (shownRef.current === value) clearInterval(timer);
//     }, 70);
//     return () => clearInterval(timer);
//   }, [value]);

//   return (
//     <AppText variant={variant} tone={tone}>
//       {shown}
//     </AppText>
//   );
// }

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "react-native-reanimated";
import { AppText, type TextTone, type TextVariant } from "./AppText";

type Props = { value: number; variant?: TextVariant; tone?: TextTone };

/** Ticks one step at a time toward the target, so small counts feel alive. Shows the number at once with reduce motion on. */
export function CountUp({
  value,
  variant = "displayXL",
  tone = "default",
}: Props) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(reduceMotion ? value : 0);
  const shownRef = useRef(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      shownRef.current = value;
      setShown(value);
      return;
    }
    if (shownRef.current === value) return;
    const step = value > shownRef.current ? 1 : -1;
    const timer = setInterval(() => {
      shownRef.current += step;
      setShown(shownRef.current);
      if (shownRef.current === value) clearInterval(timer);
    }, 70);
    return () => clearInterval(timer);
  }, [value, reduceMotion]);

  return (
    <AppText variant={variant} tone={tone}>
      {shown}
    </AppText>
  );
}
