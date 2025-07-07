const mangayomiSources = [{
  "name": "Novelfull",
  "lang": "en",
  "baseUrl": "https://novelfull.com",
  "apiUrl": "",
  "iconUrl": "https://novelfull.com/favicon.ico",
  "typeSource": "single",
  "itemType": 2, // Novel type
  "version": "1.0.2", // Increment version
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "novel/src/en/novelfull.js", // Verify this path
  "isNsfw": false,
  "hasCloudflare": true
}];

class DefaultExtension extends MProvider {
  mangaListFromPage(res) {
    // Tambah console.log untuk debugging
    console.log("mangaListFromPage: Response body length:", res.body.length);
    const doc = new Document(res.body);
    const novels = [];

    const elements = doc.select(".list-truyen .row, .novel-list .item, .col-truyen-main .row, .novel-grid .novel-item"); 
    console.log("mangaListFromPage: Found elements count:", elements.length);

    for (const el of elements) {
      const nameEl = el.selectFirst("h3.truyen-title > a, .novel-title a, .title a, h3 a");
      let name = "";
      let link = "";
      
      // Pastikan nameEl wujud sebelum memanggil text dan getHref()
      if (nameEl) {
        name = nameEl.text?.trim() || "";
        link = nameEl.getHref() || ""; // PANGGIL FUNGSI getHref()
      }

      const imageEl = el.selectFirst("img, .cover img, .novel-cover img");
      let imageUrl = "";

      // Pastikan imageEl wujud sebelum memanggil getSrc() atau getAttribute
      if (imageEl) {
        imageUrl = imageEl.getSrc() || imageEl.getAttribute("data-src") || imageEl.getAttribute("srcset") || ""; // PANGGIL FUNGSI getSrc()
      }

      // Pembetulan URL imej relatif
      if (imageUrl && imageUrl.startsWith("/")) {
        imageUrl = `https://novelfull.com${imageUrl}`;
      }
      
      console.log("mangaListFromPage: Parsed item - Name:", name, "Link:", link, "Image:", imageUrl);

      if (name && link) {
        novels.push({ name, link: `https://novelfull.com${link}`, imageUrl });
      }
    }
    
    const hasNextPage = doc.selectFirst("ul.pagination > li.active + li, .pagination .next, .next-page") !== null;
    console.log("mangaListFromPage: Has next page:", hasNextPage);
    return { list: novels, hasNextPage };
  }

  // Fungsi getPopular, getLatestUpdates, search, getDetail, getHtmlContent, cleanHtmlContent, getFilterList, getSourcePreferences
  // (Pastikan fungsi-fungsi ini mempunyai struktur yang sama seperti yang saya berikan sebelumnya,
  // dengan 'headers' dan Cloudflare checks. Saya hanya fokus pada bahagian yang menyebabkan error.)

  async getPopular(page) {
    console.log("getPopular: Fetching page:", page);
    try {
        const res = await new Client().get(`https://novelfull.com/most-popular?page=${page}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": "https://novelfull.com",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            }
        });
        if (res.body.includes("Just a moment")) {
            console.error("getPopular: Cloudflare challenge detected");
            // Mungkin kembalikan respons kosong jika Cloudflare aktif untuk mengelakkan error parser
            return { list: [], hasNextPage: false }; 
        }
        return this.mangaListFromPage(res); // Baris ini sepatutnya OK jika mangaListFromPage OK
    } catch (error) {
        console.error("getPopular: Error fetching or parsing:", error);
        return { list: [], hasNextPage: false };
    }
  }

  async getLatestUpdates(page) {
    console.log("getLatestUpdates: Fetching page:", page);
    try {
        const res = await new Client().get(`https://novelfull.com/latest-release?page=${page}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": "https://novelfull.com",
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
        const res = await new Client().get(`https://novelfull.com/search?keyword=${encodeURIComponent(query)}&page=${page}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": "https://novelfull.com",
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
                "Referer": "https://novelfull.com",
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
            imageUrl = `https://novelfull.com${imageUrl}`;
        }
        console.log("getDetail: imageUrl:", imageUrl);

        const description = doc.selectFirst(".desc-text, .desc, .novel-description")?.text?.trim() || "";
        const author = doc.selectFirst("a[property='author'], .author a, .info a")?.text?.trim() || "";
        const genre = doc.select("a[itemprop='genre'], .genre a, .category a").map((el) => el.text?.trim()).filter(g => g);
        const statusText = doc.selectFirst(".info > div, .status, .info-meta")?.text?.toLowerCase() || "";
        const status = statusText.includes("ongoing") ? 0 : statusText.includes("completed") ? 1 : 2;
        console.log("getDetail: Parsed:", { imageUrl, description, author, genre, status });

        const chapters = [];
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
                    url: `https://novelfull.com${link}`,
                    dateUpload: null,
                    scanlator: null
                });
            }
        }
        return {
            imageUrl, description, genre, author, artist: "", status, chapters
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
                "Referer": "https://novelfull.com",
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
        const title = doc.selectFirst("h2, .chapter-title, h3")?.text?.trim() || "";
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
    return [];
  }

  getSourcePreferences() {
    console.log("getSourcePreferences: Called");
    return {};
  }
}
