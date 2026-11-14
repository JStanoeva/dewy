import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { usePhotoUrl } from '@/features/products/hooks/usePhotoUrl';

type ProductPhotoProps = {
  path: string;
  style: StyleProp<ViewStyle>;
  placeholderColor: string;
  // Shown when the photo can't load, e.g. offline before it was ever cached, or the file is gone.
  fallback: ReactNode;
  // Drawn over the photo, and only while the photo (not the fallback) is shown.
  overlay?: ReactNode;
};

export function ProductPhoto({
  path,
  style,
  placeholderColor,
  fallback,
  overlay,
}: ProductPhotoProps) {
  const url = usePhotoUrl(path);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  // A link that already works keeps showing even if a later refresh of it fails.
  const failed = url.data === undefined ? url.isError : url.data === failedUrl;
  if (failed) {
    return fallback;
  }

  return (
    <View style={[styles.frame, style, { backgroundColor: placeholderColor }]}>
      {url.data ? (
        <Image
          // The path never changes for a file, so a cached photo survives a new signed link.
          source={{ uri: url.data, cacheKey: path }}
          recyclingKey={path}
          contentFit="cover"
          transition={150}
          onError={() => setFailedUrl(url.data ?? null)}
          style={styles.image}
        />
      ) : null}
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
