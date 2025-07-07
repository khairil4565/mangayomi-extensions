const mangayomiSources = [{
  "name": "Novelfull",
  "lang": "en",
  "baseUrl": "https://novelfull.com",
  "apiUrl": "",
  "iconUrl": "https://novelfull.com/favicon.ico",
  "typeSource": "single",
  "itemType": 2, // Novel type
  "version": "1.0.1", // Incremented for changes
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "novel/src/en/novelfull.js",
  "isNsfw": false,
  "hasCloudflare": true
}];

class DefaultExtension extends MProvider {
  mangaListFromPage(res) {
    try {
      console.log("Response body (first 500 chars):", res.body.substring(0, 500));
      const doc = new Document(res.body);
      const novels = [];
      const elements = doc.select(".list-truyen .row, .novel-list .item, .col-truyen-main .row"); // Fallback selectors
      console.log("Found novel elements:", elements.length);

      for (const el of elements) {
        const nameEl = el.selectFirst("h3.truyen-title > a, .novel-title a, .title a");
        const name = nameEl?.text?.trim();
        const link = nameEl?.getHref();

        const imageEl = el.selectFirst("img");
        let imageUrl = imageEl?.getSrc() || imageEl?.getAttribute("data-src") || imageEl?.getAttribute("srcset") || "";
        if (imageUrl && imageUrl.startsWith("/")) {
          imageUrl = `https://novelfull.com${imageUrl}`;
        }
        console.log("Parsed novel:", { name, link, imageUrl });

        if (name && link) {
          novels.push({ name, link: `https://novelfull.com${link}`, imageUrl });
        }
      }

      const hasNextPage = doc.selectFirst("ul.pagination > li.active + li, .pagination .next") !== null;
      console.log("Has next page:", hasNextPage);
      return { list: novels, hasNextPage };
    } catch (error) {
      console.error("Error in mangaListFromPage:", error);
      return { list: [], hasNextPage: false };
    }
  }

  async getPopular(page) {
    try {
      const res = await new Client().get(`https://novelfull.com/most-popular?page=${page}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Referer": "https://novelfull.com"
        }
      });
      console.log("getPopular status:", res.status);
      return this.mangaListFromPage(res);
    } catch (error) {
      console.error("Error in getPopular:", error);
      return { list: [], hasNextPage: false };
    }
  }

  async getLatestUpdates(page) {
    try {
      const res = await new Client().get(`https://novelfull.com/latest-release?page=${page}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Referer": "https://novelfull.com"
        }
      });
      console.log("getLatestUpdates status:", res.status);
      return this.mangaListFromPage(res);
    } catch (error) {
      console.error("Error in getLatestUpdates:", error);
      return { list: [], hasNextPage: false };
    }
  }

  async search(query, page, filters) {
    try {
      const res = await new Client().get(`https://novelfull.com/search?keyword=${encodeURIComponent(query)}&page=${page}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Referer": "https://novelfull.com"
        }
      });
      console.log("Search status:", res.status);
      return this.mangaListFromPage(res);
    } catch (error) {
      console.error("Error in search:", error);
      return { list: [], hasNextPage: false };
    }
  }

  async getDetail(url) {
    try {
      const client = new Client();
      const res = await client.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Referer": "https://novelfull.com"
        }
      });
      console.log("getDetail status:", res.status);
      const doc = new Document(res.body);

      const imageEl = doc.selectFirst(".book img, .novel-cover img, .cover-image img");
      let imageUrl = imageEl?.getSrc() || imageEl?.getAttribute("data-src") || imageEl?.getAttribute("srcset") || "";
      if (imageUrl && imageUrl.startsWith("/")) {
        imageUrl = `https://novelfull.com${imageUrl}`;
      }
      console.log("Detail imageUrl:", imageUrl);

      const description = doc.selectFirst(".desc-text, .desc, .novel-description")?.text?.trim() || "";
      const author = doc.selectFirst("a[property='author'], .author a")?.text?.trim() || "";
      const genre = doc.select("a[itemprop='genre'], .genre a").map((el) => el.text?.trim()).filter(g => g);
      const statusText = doc.selectFirst(".info > div, .status")?.text?.toLowerCase() || "";
      const status = statusText.includes("ongoing") ? 0 : statusText.includes("completed") ? 1 : 2;
      console.log("Detail parsed:", { imageUrl, description, author, genre, status });

      const chapters = [];
      const chapterElements = doc.select(".list-chapter > li");
      console.log("Found chapters:", chapterElements.length);
      for (const el of chapterElements) {
        const name = el.selectFirst("a")?.text?.trim();
        const link = el.selectFirst("a")?.getHref();
        if (name && link) {
          chapters.push({
            name,
            url: `https://novelfull.com${link}`,
            dateUpload: null,
            scanlator: null
          });
        }
      }

 bans     return {
        imageUrl,
        description,
        genre,
        author,
        artist: "",
        status,
        chapters
      };
    } catch (error) {
      console.error("Error in getDetail:", error);
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
      const res = await new Client().get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Referer": "https://novelfull.com"
        }
      });
      console.log("getHtmlContent status:", res.status);
      return this.cleanHtmlContent(res.body);
    } catch (error) {
      console.error("Error in getHtmlContent:", error);
      return "";
    }
  }

  async cleanHtmlContent(html) {
    try {
      const doc = new Document(html);
      const title = doc.selectFirst("h2, .chapter-title")?.text?.trim() || "";
      const content = doc.selectFirst(".chapter-c, .chapter-content")?.innerHtml || "";
      console.log("cleanHtmlContent title:", title);
      return `<h2>${title}</h2><hr><br>${content}`;
    } catch (error) {
      console.error("Error in cleanHtmlContent:", error);
      return "";
    }
  }

  getFilterList() {
    return [];
  }

  getSourcePreferences() {
    return {};
  }
}