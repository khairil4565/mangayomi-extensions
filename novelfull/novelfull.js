const mangayomiSources = [{
  "name": "Novelfull",
  "lang": "en",
  "baseUrl": "https://novelfull.com",
  "apiUrl": "",
  "iconUrl": "https://novelfull.com/favicon.ico",
  "typeSource": "single",
  "itemType": 2, // Novel type
  "version": "1.0.3", // Incremented to force reload
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "novel/src/en/novelfull.js", // Verify this path
  "isNsfw": false,
  "hasCloudflare": true
}];

class DefaultExtension extends MProvider {
  mangaListFromPage(res) {
    try {
      console.log("mangaListFromPage: Response body (first 500 chars):", res.body.substring(0, 500));
      const doc = new Document(res.body);
      const novels = [];

      // Try multiple selectors for novel items
      let elements = doc.select(".list-truyen .row, .novel-list .item, .col-truyen-main .row, .novel-grid .novel-item");
      console.log("mangaListFromPage: Found elements:", elements.length);

      for (const el of elements) {
        const nameEl = el.selectFirst("h3.truyen-title > a, .novel-title a, .title a, h3 a");
        const name = nameEl?.text?.trim() || "";
        const link = nameEl?.getHref() || "";

        const imageEl = el.selectFirst("img, .cover img, .novel-cover img");
        let imageUrl = imageEl?.getSrc() || imageEl?.getAttribute("data-src") || imageEl?.getAttribute("srcset") || "";
        if (imageUrl && imageUrl.startsWith("/")) {
          imageUrl = `https://novelfull.com${imageUrl}`;
        }
        console.log("mangaListFromPage: Parsed novel:", { name, link, imageUrl });

        if (name && link) {
          novels.push({ name, link: `https://novelfull.com${link}`, imageUrl });
        }
      }

      const hasNextPage = doc.selectFirst("ul.pagination > li.active + li, .pagination .next, .next-page") !== null;
      console.log("mangaListFromPage: Has next page:", hasNextPage);
      return { list: novels, hasNextPage };
    } catch (error) {
      console.error("mangaListFromPage: Error:", error);
      return { list: [], hasNextPage: false };
    }
  }

  async getPopular(page) {
    try {
      console.log("getPopular: Fetching page:", page);
      const res = await new Client().get(`https://novelfull.com/most-popular?page=${page}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Referer": "https://novelfull.com",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5"
        }
      });
      console.log("getPopular: HTTP status:", res.status);
      if (res.body.includes("Just a moment")) {
        console.error("getPopular: Cloudflare challenge detected");
      }
      return this.mangaListFromPage(res);
    } catch (error) {
      console.error("getPopular: Error:", error);
      return { list: [], hasNextPage: false };
    }
  }

  async getLatestUpdates(page) {
    try {
      console.log("getLatestUpdates: Fetching page:", page);
      const res = await new Client().get(`https://novelfull.com/latest-release?page=${page}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Referer": "https://novelfull.com",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5"
        }
      });
      console.log("getLatestUpdates: HTTP status:", res.status);
      if (res.body.includes("Just a moment")) {
        console.error("getLatestUpdates: Cloudflare challenge detected");
      }
      return this.mangaListFromPage(res);
    } catch (error) {
      console.error("getLatestUpdates: Error:", error);
      return { list: [], hasNextPage: false };
    }
  }

  async search(query, page, filters) {
    try {
      console.log("search: Query:", query, "Page:", page);
      const res = await new Client().get(`https://novelfull.com/search?keyword=${encodeURIComponent(query)}&page=${page}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Referer": "https://novelfull.com",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5"
        }
      });
      console.log("search: HTTP status:", res.status);
      if (res.body.includes("Just a moment")) {
        console.error("search: Cloudflare challenge detected");
      }
      return this.mangaListFromPage(res);
    } catch (error) {
      console.error("search: Error:", error);
      return { list: [], hasNextPage: false };
    }
  }

  async getDetail(url) {
    try {
      console.log("getDetail: Fetching URL:", url);
      const client = new Client();
      const res = await client.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Referer": "https://novelfull.com",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5"
        }
      });
      console.log("getDetail: HTTP status:", res.status);
      if (res.body.includes("Just a moment")) {
        console.error("getDetail: Cloudflare challenge detected");
      }
      const doc = new Document(res.body);

      const imageEl = doc.selectFirst(".book img, .novel-cover img, .cover-image img, .info img");
      let imageUrl = imageEl?.getSrc() || imageEl?.getAttribute("data-src") || imageEl?.getAttribute("srcset") || "";
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
        const name = el.selectFirst("a")?.text?.trim() || "";
        const link = el.selectFirst("a")?.getHref() || "";
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
        imageUrl,
        description,
        genre,
        author,
        artist: "",
        status,
        chapters
      };
    } catch (error) {
      console.error("getDetail: Error:", error);
      return {
        imageUrl: "",
        description: "",
        genre: [],
        author: "",
        artist: "",
        status: 2,
        chapters: []
      };
    }
  }

  async getHtmlContent(name, url) {
    try {
      console.log("getHtmlContent: Fetching URL:", url);
      const res = await new Client().get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Referer": "https://novelfull.com",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5"
        }
      });
      console.log("getHtmlContent: HTTP status:", res.status);
      if (res.body.includes("Just a moment")) {
        console.error("getHtmlContent: Cloudflare challenge detected");
      }
      return this.cleanHtmlContent(res.body);
    } catch (error) {
      console.error("getHtmlContent: Error:", error);
      return "";
    }
  }

  async cleanHtmlContent(html) {
    try {
      console.log("cleanHtmlContent: Processing HTML");
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