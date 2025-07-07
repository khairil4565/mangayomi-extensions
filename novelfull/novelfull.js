const mangayomiSources = [{
  "name": "Novelfull",
  "lang": "en",
  "baseUrl": "https://novelfull.com",
  "apiUrl": "",
  "iconUrl": "https://novelfull.com/favicon.ico",
  "typeSource": "single",
  "itemType": 2, // Novel type
  "version": "1.0.1", // Increment version to force reload in Mangayomi
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "novel/src/en/novelfull.js", // Verify this path
  "isNsfw": false,
  "hasCloudflare": true
}];

class DefaultExtension extends MProvider {
  mangaListFromPage(res) {
    const doc = new Document(res.body);
    const novels = [];

    // Gunakan pelbagai selector untuk lebih robust
    const elements = doc.select(".list-truyen .row, .novel-list .item, .col-truyen-main .row, .novel-grid .novel-item"); 

    for (const el of elements) {
      // Panggil getHref() sebagai fungsi
      const nameEl = el.selectFirst("h3.truyen-title > a, .novel-title a, .title a, h3 a");
      const name = nameEl?.text?.trim() || "";
      const link = nameEl?.getHref() || ""; // PENTING: getHref() dengan kurungan

      // Panggil getSrc() sebagai fungsi dan semak atribut lain
      const imageEl = el.selectFirst("img, .cover img, .novel-cover img");
      let imageUrl = imageEl?.getSrc() || imageEl?.getAttribute("data-src") || imageEl?.getAttribute("srcset") || ""; // PENTING: getSrc() dengan kurungan

      // Pembetulan URL imej relatif
      if (imageUrl && imageUrl.startsWith("/")) {
        imageUrl = `https://novelfull.com${imageUrl}`;
      }
      
      // Pastikan nama dan link wujud sebelum menambah
      if (name && link) {
        novels.push({ name, link: `https://novelfull.com${link}`, imageUrl });
      }
    }
    // Guna pelbagai selector untuk next page juga
    const hasNextPage = doc.selectFirst("ul.pagination > li.active + li, .pagination .next, .next-page") !== null;
    return { list: novels, hasNextPage };
  }

  async getPopular(page) {
    const res = await new Client().get(`https://novelfull.com/most-popular?page=${page}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": "https://novelfull.com",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });
    // Tambah Cloudflare check untuk debugging
    if (res.body.includes("Just a moment")) {
      console.error("getPopular: Cloudflare challenge detected");
    }
    return this.mangaListFromPage(res);
  }

  async getLatestUpdates(page) {
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
    }
    return this.mangaListFromPage(res);
  }

  async search(query, page, filters) {
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
    }
    return this.mangaListFromPage(res);
  }

  async getDetail(url) {
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
    }
    const doc = new Document(res.body);

    // Panggil getSrc() sebagai fungsi dan semak atribut lain untuk gambar butiran
    const imageEl = doc.selectFirst(".book img, .novel-cover img, .cover-image img, .info img");
    let imageUrl = imageEl?.getSrc() || imageEl?.getAttribute("data-src") || imageEl?.getAttribute("srcset") || ""; // PENTING: getSrc() dengan kurungan
    if (imageUrl && imageUrl.startsWith("/")) {
      imageUrl = `https://novelfull.com${imageUrl}`;
    }

    const description = doc.selectFirst(".desc-text, .desc, .novel-description")?.text?.trim() || "";
    const author = doc.selectFirst("a[property='author'], .author a, .info a")?.text?.trim() || "";
    const genre = doc.select("a[itemprop='genre'], .genre a, .category a").map((el) => el.text?.trim()).filter(g => g);
    const statusText = doc.selectFirst(".info > div, .status, .info-meta")?.text?.toLowerCase() || "";
    const status = statusText.includes("ongoing") ? 0 : statusText.includes("completed") ? 1 : 2;

    const chapters = [];
    // Guna semula doc, tak perlu ChapterDoc baru
    const chapterElements = doc.select(".list-chapter > li, .chapter-list li"); // Guna pelbagai selector
    for (const el of chapterElements) {
      const name = el.selectFirst("a")?.text?.trim() || "";
      const link = el.selectFirst("a")?.getHref() || ""; // PENTING: getHref() dengan kurungan
      if (name && link) { // Pastikan nama dan link wujud
        chapters.push({
          name,
          url: `https://novelfull.com${link}`, // Pembetulan URL relatif
          dateUpload: null,
          scanlator: null
        });
      }
    }

    return {
      imageUrl,
      description,
      genre,
      author,
      artist: "",
      status,
      chapters
    };
  }

  async getHtmlContent(name, url) {
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
    }
    return this.cleanHtmlContent(res.body);
  }

  async cleanHtmlContent(html) {
    const doc = new Document(html);
    const title = doc.selectFirst("h2, .chapter-title, h3")?.text?.trim() || ""; // Guna pelbagai selector
    const content = doc.selectFirst(".chapter-c, .chapter-content, .content")?.innerHtml || ""; // Guna pelbagai selector
    return `<h2>${title}</h2><hr><br>${content}`;
  }

  getFilterList() {
    return [];
  }

  getSourcePreferences() {
    return {};
  }
}
