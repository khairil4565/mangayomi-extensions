const mangayomiSources = [{
  "name": "Novelfull",
  "lang": "en",
  "baseUrl": "https://novelfull.com",
  "apiUrl": "", // Tidak digunakan secara langsung, kekalkan kosong
  "iconUrl": "https://novelfull.com/favicon.ico",
  "typeSource": "single",
  "itemType": 2, // Novel type
  "version": "1.0.3", // Pastikan versi ini diincrementkan setiap kali anda update
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "novel/src/en/novelfull.js", // Sahkan laluan ini
  "isNsfw": false,
  "hasCloudflare": true // Sangat penting untuk NovelFull
}];

class DefaultExtension extends MProvider {

  // Tambah fungsi getHeaders() seperti dalam Wordrain69 jika anda perlukan custom headers untuk setiap request
  // Buat masa ni, kita akan letakkan headers dalam setiap Client().get() call
  getHeaders(url) {
    // Fungsi ini tidak selalu diperlukan jika headers standard sudah mencukupi.
    // Jika ada masalah dengan specific URL, boleh implement custom headers di sini.
    // Contoh:
    // return {
    //   "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    //   "Referer": "https://novelfull.com",
    //   "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    //   "Accept-Language": "en-US,en;q=0.5"
    // };
    return {}; // Buat masa ni kita pulangkan objek kosong
  }

  mangaListFromPage(res) {
    // Tambah console.log untuk debugging
    console.log("mangaListFromPage: Response body length:", res.body.length);
    const doc = new Document(res.body);
    const novels = [];

    // Menggunakan multiple selectors seperti dalam versi sebelumnya untuk robustness
    const elements = doc.select(".list-truyen .row, .novel-list .item, .col-truyen-main .row, .novel-grid .novel-item"); 
    console.log("mangaListFromPage: Found elements count:", elements.length);

    for (const el of elements) {
      const nameEl = el.selectFirst("h3.truyen-title > a, .novel-title a, .title a, h3 a");
      let name = "";
      let link = "";
      
      if (nameEl) {
        name = nameEl.text?.trim() || "";
        link = nameEl.getHref() || ""; // PENTING: getHref() sebagai fungsi
      }

      const imageEl = el.selectFirst("img, .cover img, .novel-cover img");
      let imageUrl = "";
      if (imageEl) {
        imageUrl = imageEl.getSrc() || imageEl.getAttribute("data-src") || imageEl.getAttribute("srcset") || ""; // PENTING: getSrc() sebagai fungsi
      }

      // Pembetulan URL imej relatif
      if (imageUrl && imageUrl.startsWith("/")) {
        imageUrl = `${this.source.baseUrl}${imageUrl}`;
      }
      
      console.log("mangaListFromPage: Parsed item - Name:", name, "Link:", link, "Image:", imageUrl);

      if (name && link) {
        // Pastikan link novel lengkap
        novels.push({ name, link: `${this.source.baseUrl}${link}`, imageUrl });
      }
    }
    
    // Guna multiple selectors untuk next page
    const hasNextPage = doc.selectFirst("ul.pagination > li.active + li, .pagination .next, .next-page") !== null;
    console.log("mangaListFromPage: Has next page:", hasNextPage);
    return { list: novels, hasNextPage };
  }

  // Fungsi pembantu untuk menukar teks status ke kod status numerik
  toStatus(statusText) {
    if (statusText.includes("ongoing")) return 0;
    else if (statusText.includes("completed")) return 1;
    else if (statusText.includes("hiatus")) return 2; // Tambah jika NovelFull ada status Hiatus
    else if (statusText.includes("dropped")) return 3; // Tambah jika NovelFull ada status Dropped
    else return 5; // Status Tidak Diketahui
  }

  async getPopular(page) {
    console.log("getPopular: Fetching page:", page);
    try {
        const res = await new Client().get(`${this.source.baseUrl}/most-popular?page=${page}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": this.source.baseUrl,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            }
        });
        if (res.body.includes("Just a moment")) {
            console.error("getPopular: Cloudflare challenge detected");
            return { list: [], hasNextPage: false }; 
        }
        return this.mangaListFromPage(res);
    } catch (error) {
        console.error("getPopular: Error fetching or parsing:", error);
        return { list: [], hasNextPage: false };
    }
  }

  async getLatestUpdates(page) {
    console.log("getLatestUpdates: Fetching page:", page);
    try {
        const res = await new Client().get(`${this.source.baseUrl}/latest-release?page=${page}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": this.source.baseUrl,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            }
        });
        if (res.body.includes("Just a moment")) {
            console.error("getLatestUpdates: Cloudflare challenge detected");
            return { list: [], hasNextPage: false }; 
        }
        return this.mangaListFromPage(res);
    } catch (error) {
        console.error("getLatestUpdates: Error fetching or parsing:", error);
        return { list: [], hasNextPage: false };
    }
  }

  async search(query, page, filters) {
    console.log("search: Query:", query, "Page:", page);
    try {
        const res = await new Client().get(`${this.source.baseUrl}/search?keyword=${encodeURIComponent(query)}&page=${page}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": this.source.baseUrl,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            }
        });
        if (res.body.includes("Just a moment")) {
            console.error("search: Cloudflare challenge detected");
            return { list: [], hasNextPage: false }; 
        }
        return this.mangaListFromPage(res);
    } catch (error) {
        console.error("search: Error fetching or parsing:", error);
        return { list: [], hasNextPage: false };
    }
  }

  async getDetail(url) {
    console.log("getDetail: Fetching URL:", url);
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
        if (res.body.includes("Just a moment")) {
            console.error("getDetail: Cloudflare challenge detected");
            return {
                imageUrl: "", description: "", genre: [], author: "", artist: "", status: 2, chapters: []
            };
        }
        const doc = new Document(res.body);

        const imageEl = doc.selectFirst(".book img, .novel-cover img, .cover-image img, .info img");
        let imageUrl = "";
        if (imageEl) {
            imageUrl = imageEl.getSrc() || imageEl.getAttribute("data-src") || imageEl.getAttribute("srcset") || "";
        }
        if (imageUrl && imageUrl.startsWith("/")) {
            imageUrl = `${this.source.baseUrl}${imageUrl}`;
        }
        console.log("getDetail: imageUrl:", imageUrl);

        // Wordrain69 guna p > span, NovelFull guna .desc-text
        const description = doc.selectFirst(".desc-text, .desc, .novel-description")?.text?.trim() || "";
        
        // Selector author, artist, status, genre/tags
        const author = doc.selectFirst("a[property='author'], .author a, .info a")?.text?.trim() || "";
        // NovelFull biasanya tidak membezakan artist, jadi boleh kekalkan kosong
        const artist = ""; 
        
        const statusText = doc.selectFirst(".info > div, .status, .info-meta")?.text?.toLowerCase() || "";
        const status = this.toStatus(statusText); // Guna fungsi toStatus yang baru
        
        const genre = doc.select("a[itemprop='genre'], .genre a, .category a").map((el) => el.text?.trim()).filter(g => g);
        // NovelFull tiada "tags-content" seperti Wordrain69, jadi kita tidak gabungkan tags ke genre di sini.

        const chapters = [];
        // NovelFull tidak menggunakan AJAX POST untuk bab seperti Wordrain69.
        // Bab-bab biasanya sudah ada dalam HTML utama.
        const chapterElements = doc.select(".list-chapter > li, .chapter-list li");
        console.log("getDetail: Found chapters:", chapterElements.length);
        for (const el of chapterElements) {
            const nameEl = el.selectFirst("a");
            let name = "";
            let link = "";
            if (nameEl) {
                name = nameEl.text?.trim() || "";
                link = nameEl.getHref() || "";
            }
            if (name && link) {
                chapters.push({
                    name,
                    url: `${this.source.baseUrl}${link}`, // Pastikan URL bab lengkap
                    dateUpload: null, // Novelfull tidak menyediakan tarikh kemas kini bab dengan mudah
                    scanlator: null
                });
            }
        }
        return {
            imageUrl, description, genre, author, artist, status, chapters
        };
    } catch (error) {
        console.error("getDetail: Error:", error);
        return {
            imageUrl: "", description: "", genre: [], author: "", artist: "", status: 2, chapters: []
        };
    }
  }

  async getHtmlContent(name, url) {
    console.log("getHtmlContent: Fetching URL:", url);
    try {
        const res = await new Client().get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": this.source.baseUrl,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            }
        });
        if (res.body.includes("Just a moment")) {
            console.error("getHtmlContent: Cloudflare challenge detected");
            return "";
        }
        return this.cleanHtmlContent(res.body);
    } catch (error) {
        console.error("getHtmlContent: Error:", error);
        return "";
    }
  }

  async cleanHtmlContent(html) {
    console.log("cleanHtmlContent: Processing HTML");
    try {
        const doc = new Document(html);
        // Selector tajuk bab untuk NovelFull
        const title = doc.selectFirst("h2, .chapter-title, h3")?.text?.trim() || ""; 
        // Selector kandungan bab untuk NovelFull
        const content = doc.selectFirst(".chapter-c, .chapter-content, .content")?.innerHtml || ""; 
        console.log("cleanHtmlContent: Title:", title);
        return `<h2>${title}</h2><hr><br>${content}`;
    } catch (error) {
        console.error("cleanHtmlContent: Error:", error);
        return "";
    }
  }

  getFilterList() {
    console.log("getFilterList: Called");
    return []; // NovelFull tidak menyediakan penapis yang kompleks melalui URL
  }

  getSourcePreferences() {
    console.log("getSourcePreferences: Called");
    // Tidak ada preferensi khusus untuk sumber ini buat masa ini
    return {}; 
  }

  // Fungsi parseDate dari Wordrain69 - tidak digunakan secara langsung untuk bab NovelFull kerana tiada tarikh mudah
  // Namun, ia berguna jika anda dapati tarikh pada masa hadapan
  parseDate(date) {
    const months = {
      "january": "01", "february": "02", "march": "03", "april": "04", "may": "05", "june": "06",
      "july": "07", "august": "08", "september": "09", "october": "10", "november": "11", "december": "12"
    };
    date = date.toLowerCase().replace(",", "").split(" ");

    if (!(date[0] in months)) {
      return String(new Date().valueOf())
    }

    date[0] = months[date[0]];
    date = [date[2], date[0], date[1]];
    date = date.join("-");
    return String(new Date(date).valueOf());
  }
}
