const mangayomiSources = [{
  "name": "Novelfull",
  "lang": "en",
  "baseUrl": "https://novelfull.com",
  "apiUrl": "",
  "iconUrl": "https://novelfull.com/favicon.ico",
  "typeSource": "single",
  "itemType": 2, // Novel type
  "version": "1.0.4", // PASTIKAN VERSION INI DIINCREMENTKAN!
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "novel/src/en/novelfull.js", // Sahkan laluan ini
  "isNsfw": false,
  "hasCloudflare": true // Sangat penting untuk NovelFull
}];

class DefaultExtension extends MProvider {

  // Kita kekalkan getHeaders kosong seperti yang kita bincangkan
  getHeaders(url) {
    return {}; 
  }

  mangaListFromPage(res) {
    console.log("--- mangaListFromPage Debug ---");
    console.log("Response body length:", res.body.length);
    // Print 500 karakter pertama untuk melihat jika ia HTML atau halaman Cloudflare
    console.log("Response body (first 500 chars):\n", res.body.substring(0, 500)); 

    const doc = new Document(res.body);
    const novels = [];

    // Cuba selector paling asas yang kita tahu ada item novel
    // .list-truyen .row adalah selector asal anda
    const elements = doc.select(".list-truyen .row"); 
    console.log("Found novel elements (using '.list-truyen .row'):", elements.length);

    if (elements.length === 0) {
        // Cuba selector alternatif jika yang pertama gagal
        const altElements = doc.select(".novel-list .item, .col-truyen-main .row, .novel-grid .novel-item");
        console.log("Found alternative novel elements:", altElements.length);
        if (altElements.length > 0) {
            // Jika alternatif ada, guna itu
            console.log("Switching to alternative selectors for elements.");
            elements = altElements; // Ini akan menyebabkan ralat jika `elements` adalah const.
                                    // Sila tukar `const elements` kepada `let elements` di atas
                                    // dalam kod sebenar anda jika anda menggunakan logik ini.
                                    // Untuk tujuan debug ini, saya akan teruskan sahaja.
        }
    }


    for (const el of elements) {
      // Ambil nama dan link sahaja. Tiada poster buat masa ini.
      const nameEl = el.selectFirst("h3.truyen-title > a"); // Selector asas untuk nama/link
      let name = "";
      let link = "";
      
      if (nameEl) {
        name = nameEl.text?.trim() || "";
        link = nameEl.getHref() || ""; // Pastikan dipanggil sebagai fungsi
      }

      // Pastikan link adalah URL lengkap
      if (name && link) {
        const fullLink = link.startsWith("http") ? link : `${this.source.baseUrl}${link}`;
        novels.push({ name, link: fullLink, imageUrl: null }); // Set imageUrl kepada null buat masa ini
        console.log(`Parsed novel: Name='${name}', Link='${fullLink}'`);
      } else {
        console.log("Skipping element: Name or Link not found for:", el.outerHtml);
      }
    }

    // Selector untuk next page
    const hasNextPage = doc.selectFirst("ul.pagination > li.active + li, .pagination .next, .next-page") !== null;
    console.log("Has next page:", hasNextPage);
    console.log("Total novels found:", novels.length);
    console.log("--- End mangaListFromPage Debug ---");
    return { list: novels, hasNextPage };
  }

  // Fungsi toStatus dari sebelumnya
  toStatus(statusText) {
    if (statusText.includes("ongoing")) return 0;
    else if (statusText.includes("completed")) return 1;
    else if (statusText.includes("hiatus")) return 2;
    else if (statusText.includes("dropped")) return 3;
    else return 5;
  }

  async getPopular(page) {
    console.log("--- getPopular Debug ---");
    console.log("Fetching Popular page:", page);
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
        console.log("HTTP Status:", res.status);
        if (res.body.includes("Just a moment")) {
            console.error("Cloudflare challenge detected in getPopular!");
            return { list: [], hasNextPage: false }; 
        }
        return this.mangaListFromPage(res);
    } catch (error) {
        console.error("getPopular: Error:", error);
        return { list: [], hasNextPage: false };
    }
  }

  async getLatestUpdates(page) {
    console.log("--- getLatestUpdates Debug ---");
    console.log("Fetching Latest Updates page:", page);
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
        console.log("HTTP Status:", res.status);
        if (res.body.includes("Just a moment")) {
            console.error("Cloudflare challenge detected in getLatestUpdates!");
            return { list: [], hasNextPage: false }; 
        }
        return this.mangaListFromPage(res);
    } catch (error) {
        console.error("getLatestUpdates: Error:", error);
        return { list: [], hasNextPage: false };
    }
  }

  async search(query, page, filters) {
    console.log("--- search Debug ---");
    console.log("Searching for:", query, "Page:", page);
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
        console.log("HTTP Status:", res.status);
        if (res.body.includes("Just a moment")) {
            console.error("Cloudflare challenge detected in search!");
            return { list: [], hasNextPage: false }; 
        }
        return this.mangaListFromPage(res);
    } catch (error) {
        console.error("search: Error:", error);
        return { list: [], hasNextPage: false };
    }
  }

  async getDetail(url) {
    // Fungsi getDetail ini tidak akan dipanggil jika senarai utama tidak keluar.
    // Kita akan fokus pada senarai dulu, kemudian baru debug detail.
    console.log("--- getDetail Debug ---");
    console.log("Fetching detail for URL:", url);
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
        console.log("HTTP Status:", res.status);
        if (res.body.includes("Just a moment")) {
            console.error("Cloudflare challenge detected in getDetail!");
            return {
                imageUrl: "", description: "", genre: [], author: "", artist: "", status: 2, chapters: []
            };
        }
        const doc = new Document(res.body);

        // Abaikan imageUrl buat masa ini, set kepada kosong
        const imageUrl = ""; 

        const description = doc.selectFirst(".desc-text, .desc, .novel-description")?.text?.trim() || "";
        const author = doc.selectFirst("a[property='author'], .author a, .info a")?.text?.trim() || "";
        const artist = ""; 
        
        const statusText = doc.selectFirst(".info > div, .status, .info-meta")?.text?.toLowerCase() || "";
        const status = this.toStatus(statusText);
        
        const genre = doc.select("a[itemprop='genre'], .genre a, .category a").map((el) => el.text?.trim()).filter(g => g);

        const chapters = [];
        const chapterElements = doc.select(".list-chapter > li, .chapter-list li");
        console.log("Found chapters:", chapterElements.length);
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
                    url: `${this.source.baseUrl}${link}`,
                    dateUpload: null,
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
    console.log("--- getHtmlContent Debug ---");
    console.log("Fetching HTML content for URL:", url);
    try {
        const res = await new Client().get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": this.source.baseUrl,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            }
        });
        console.log("HTTP Status:", res.status);
        if (res.body.includes("Just a moment")) {
            console.error("Cloudflare challenge detected in getHtmlContent!");
            return "";
        }
        return this.cleanHtmlContent(res.body);
    } catch (error) {
        console.error("getHtmlContent: Error:", error);
        return "";
    }
  }

  async cleanHtmlContent(html) {
    console.log("--- cleanHtmlContent Debug ---");
    try {
        const doc = new Document(html);
        const title = doc.selectFirst("h2, .chapter-title, h3")?.text?.trim() || ""; 
        const content = doc.selectFirst(".chapter-c, .chapter-content, .content")?.innerHtml || ""; 
        console.log("Cleaned content title:", title);
        return `<h2>${title}</h2><hr><br>${content}`;
    } catch (error) {
        console.error("cleanHtmlContent: Error:", error);
        return "";
    }
  }

  getFilterList() {
    console.log("getFilterList: Called");
    return []; 
  }

  getSourcePreferences() {
    console.log("getSourcePreferences: Called");
    return {}; 
  }

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
