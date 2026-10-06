import { ViewStyle } from "react-native";

export function getResponsiveContentStyle(
  width: number,
  maxWidth = 960,
): ViewStyle {
  return {
    alignSelf: "center",
    maxWidth,
    paddingHorizontal: width < 360 ? 14 : width >= 768 ? 32 : 20,
    width: "100%",
  };
}
