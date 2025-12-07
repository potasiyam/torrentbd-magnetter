/**
 * Torrent to Magnet Converter
 * Handles Bencode parsing and SHA-1 hashing to generate magnet links.
 */

const TorrentConverter = {
  /**
   * decodes a bencoded buffer
   */
  decode: function(buffer) {
    let pos = 0;
    const data = new Uint8Array(buffer);

    function parse() {
      if (pos >= data.length) return null;
      const char = data[pos];
      
      // Integer: i<contents>e
      if (char === 105) { // 'i'
        pos++;
        const start = pos;
        while (pos < data.length && data[pos] !== 101) pos++; // 'e'
        if (pos >= data.length) throw new Error("Unterminated integer");
        const str = new TextDecoder().decode(data.slice(start, pos));
        pos++;
        return parseInt(str);
      }
      
      // String: <length>:<contents>
      if (char >= 48 && char <= 57) { // '0'-'9'
        const start = pos;
        while (pos < data.length && data[pos] !== 58) pos++; // ':'
        if (pos >= data.length) throw new Error("Invalid string length");
        const len = parseInt(new TextDecoder().decode(data.slice(start, pos)));
        pos++;
        const strVal = data.slice(pos, pos + len);
        pos += len;
        
        // Return string for keys, but keep raw buffer for hashing usually
        // For simplicity in this specific use case, we verify 'info' key handling elsewhere
        // But for "info" dictionary, we need exact raw bytes.
        // Let's return a special object or just the Uint8Array
        try {
            return new TextDecoder().decode(strVal);
        } catch(e) {
            return strVal;
        }
      }
      
      // List: l<contents>e
      if (char === 108) { // 'l'
        pos++;
        const list = [];
        while (pos < data.length && data[pos] !== 101) {
          list.push(parse());
        }
        pos++;
        return list;
      }
      
      // Dictionary: d<contents>e
      if (char === 100) { // 'd'
        pos++;
        const dict = {};
        while (pos < data.length && data[pos] !== 101) {
          const key = parse(); // Keys must be strings
          // Special handling for 'info' dictionary to extract raw bytes for hashing
          if (key === 'info') {
             const startInfo = pos;
             const value = parse();
             const endInfo = pos;
             // Store the raw info buffer hidden on the object
             dict['_raw_info_'] = data.slice(startInfo, endInfo);
             dict[key] = value;
          } else {
             dict[key] = parse();
          }
        }
        pos++;
        return dict;
      }
      
      throw new Error("Unexpected character: " + char);
    }

    return parse();
  },

  /**
   * Generates a magnet URI from a Torrent Activity ArrayBuffer
   * @param {ArrayBuffer} arrayBuffer 
   * @param {Array<string>} [customTrackers] If provided and not empty, these will be used instead of the file's trackers.
   */
  toMagnet: async function(arrayBuffer, customTrackers = []) {
    try {
      const decoded = this.decode(arrayBuffer);
      if (!decoded || !decoded.info || !decoded['_raw_info_']) {
        throw new Error("Invalid torrent file: missing info dictionary");
      }
      
      // Calculate SHA-1 hash of the info dictionary
      const hashBuffer = await window.crypto.subtle.digest('SHA-1', decoded['_raw_info_']);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      let magnet = `magnet:?xt=urn:btih:${hashHex}`;
      
      // Add display name if available
      if (decoded.info.name) {
        magnet += `&dn=${encodeURIComponent(decoded.info.name)}`;
      }
      
      // Trackers Logic
      if (customTrackers && customTrackers.length > 0) {
          // Use custom trackers ONLY
          customTrackers.forEach(url => magnet += `&tr=${encodeURIComponent(url)}`);
      } else {
          // Use internal trackers
          if (decoded['announce-list']) {
            decoded['announce-list'].forEach(tier => {
               if (Array.isArray(tier)) {
                 tier.forEach(url => magnet += `&tr=${encodeURIComponent(url)}`);
               }
            });
          } else if (decoded.announce) {
            magnet += `&tr=${encodeURIComponent(decoded.announce)}`;
          }
      }
      
      return magnet;
    } catch (e) {
      console.error("Magnet conversion failed:", e);
      return null;
    }
  }
};

window.TorrentConverter = TorrentConverter;
