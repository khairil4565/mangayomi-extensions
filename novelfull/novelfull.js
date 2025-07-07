const mangayomiSources = [{
  "name": "Novelfull",
  "lang": "en",
  "baseUrl": "https://novelfull.com",
  "apiUrl": "",
  "iconUrl": "https://novelfull.com/favicon.ico",
  "typeSource": "single",
  "itemType": 2, // Novel type
  "version": "1.0.6", // PASTIKAN VERSION INI DIINCREMENTKAN!
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "novel/src/en/novelfull.js", // Sahkan laluan ini
  "isNsfw": false,
  "hasCloudflare": false // DISETKAN KEPADA FALSE
}];

class DefaultExtension extends MProvider {

  getHeaders(url) {
    return {};
  }

  // Fungsi ini kini hanya untuk debugging. Ia tidak akan parse apa-apa.
  mangaListFromPage(res) {
    console.log("--- DEBUG: mangaListFromPage Called (No Cloudflare Check) ---");
    console.log("HTTP Response Status:", res.status);
    console.log("Response Body Length:", res.body.length);
    console.log("First 1000 characters of Response Body:");
    console.log(res.body.substring(0, 1000)); 
    
    // Kita tidak akan parse apa-apa di sini. Hanya kembali senarai kosong.
    return { list: [], hasNextPage: false };
  }

  async getPopular(page) {
    console.log("--- DEBUG: getPopular Called (No Cloudflare Check) ---");
    try {
        const url = `${this.source.baseUrl}/most-popular?page=${page}`;
        console.log("Requesting URL:", url);
        const res = await new Client().get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": this.source.baseUrl,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            }
        });
        // Tiada Cloudflare check di sini
        return this.mangaListFromPage(res); 
    } catch (error) {
        console.error("getPopular: Error during HTTP request:", error);
        return { list: [], hasNextPage: false };
    }
  }

  async getLatestUpdates(page) {
    console.log("--- DEBUG: getLatestUpdates Called (No Cloudflare Check) ---");
    try {
        const url = `${this.source.baseUrl}/latest-release?page=${page}`;
        console.log("Requesting URL:", url);
        const res = await new Client().get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": this.source.baseUrl,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            }
        });
        return this.mangaListFromPage(res);
    } catch (error) {
        console.error("getLatestUpdates: Error during HTTP request:", error);
        return { list: [], hasNextPage: false };
    }
  }

  async search(query, page, filters) {
    console.log("--- DEBUG: search Called (No Cloudflare Check) ---");
    try {
        const url = `${this.source.baseUrl}/search?keyword=${encodeURIComponent(query)}&page=${page}`;
        console.log("Requesting URL:", url);
        const res = await new Client().get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": this.source.baseUrl,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            }
        });
        return this.mangaListFromPage(res);
    } catch (error) {
        console.error("search: Error during HTTP request:", error);
        return { list: [], hasNextPage: false };
    }
  }

  // Fungsi-fungsi lain di bawah ini kekal tidak berubah kerana tidak dipanggil untuk senarai utama.

  toStatus(statusText) {
    if (statusText.includes("ongoing")) return 0;
    else if (statusText.includes("completed")) return 1;
    else if (statusText.includes("hiatus")) return 2;
    else if (statusText.includes("dropped")) return 3;
    else return 5;
  }

  async getDetail(url) {
    console.log("--- DEBUG: getDetail Called (No Cloudflare Check) ---");
    try {
        const client = new Client();
        const res = await client.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": this.source.baseUrl,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            }
        });
        // Tiada Cloudflare check di sini
        return { imageUrl: "", description: "", genre: [], author: "", artist: "", status: 2, chapters: [] };
    } catch (error) {
        console.error("getDetail: Error:", error);
        return { imageUrl: "", description: "", genre: [], author: "", artist: "", status: 2, chapters: [] };
    }
  }

  async getHtmlContent(name, url) {
    console.log("--- DEBUG: getHtmlContent Called (No Cloudflare Check) ---");
    try {
        const res = await new Client().get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": this.source.baseUrl,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            }
        });
        // Tiada Cloudflare check di sini
        return "";
    } catch (error) {
        console.error("getHtmlContent: Error:", error);
        return "";
    }
  }

  async cleanHtmlContent(html) {
    return "";
  }

  getFilterList() {
    return [];
  }

  getSourcePreferences() {
    return {};
  }

  parseDate(date) {
    return String(new Date().valueOf());
  }
}
