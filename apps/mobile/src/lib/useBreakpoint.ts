import { Platform } from 'react-native';
import { useWindowDimensions } from 'react-native';

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  return {
    isMobile: !isWeb || width < 768,
    isDesktop: isWeb && width >= 768,
    isWide: isWeb && width >= 1200,
  };
}
