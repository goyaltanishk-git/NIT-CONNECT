import CryptoJS from "crypto-js";

const SECRET = import.meta.env.VITE_ENCRYPT_KEY || "default-32-char-key";

export  const  encryptedStorage= {
 set(key, value){
    try {
      const encrypted = CryptoJS.AES.encrypt(
        value,
        SECRET
      ).toString();
      localStorage.setItem(key, encrypted);
    } catch (err) {
      console.error("Encryption error:", err);
    }
  },

 get(key) {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      const bytes = CryptoJS.AES.decrypt(encrypted, SECRET);
      return (bytes.toString(CryptoJS.enc.Utf8));
    } catch (err) {
      console.error("Decryption error:", err);
      return null;
    }
  }

 
};
