import AsyncStorage from '@react-native-async-storage/async-storage';
import * as aesjs from 'aes-js';
import { getRandomValues } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

// SecureStore caps values at about 2 KB, so it holds only the AES-256 key and AsyncStorage holds the ciphertext.
async function getEncryptionKey(storageKey: string) {
  const existingHex = await SecureStore.getItemAsync(storageKey);
  if (existingHex) {
    return aesjs.utils.hex.toBytes(existingHex);
  }
  const created = getRandomValues(new Uint8Array(32));
  await SecureStore.setItemAsync(storageKey, aesjs.utils.hex.fromBytes(created));
  return created;
}

// aes-js's utf8.fromBytes mangles 4-byte characters such as emoji, so decode through percent-encoding.
function decodeUtf8(bytes: Uint8Array) {
  return decodeURIComponent(aesjs.utils.hex.fromBytes(bytes).replace(/../g, '%$&'));
}

export const secureSessionStorage = {
  async getItem(key: string) {
    const stored = await AsyncStorage.getItem(key);
    if (!stored) {
      return null;
    }
    try {
      const [ivHex, cipherHex] = stored.split(':');
      const keyHex = await SecureStore.getItemAsync(key);
      if (!keyHex || !ivHex || !cipherHex) {
        return null;
      }
      const cipher = new aesjs.ModeOfOperation.ctr(
        aesjs.utils.hex.toBytes(keyHex),
        new aesjs.Counter(aesjs.utils.hex.toBytes(ivHex)),
      );
      return decodeUtf8(cipher.decrypt(aesjs.utils.hex.toBytes(cipherHex)));
    } catch {
      // Unreadable data, such as ciphertext left without its key, counts as signed out.
      return null;
    }
  },
  async setItem(key: string, value: string) {
    const encryptionKey = await getEncryptionKey(key);
    const iv = getRandomValues(new Uint8Array(16));
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(iv));
    const cipherBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await AsyncStorage.setItem(
      key,
      `${aesjs.utils.hex.fromBytes(iv)}:${aesjs.utils.hex.fromBytes(cipherBytes)}`,
    );
  },
  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  },
};
