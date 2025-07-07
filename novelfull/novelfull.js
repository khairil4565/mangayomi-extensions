const mangayomiSources = [{
  "name": "Novelfull",
  "lang": "en",
  "baseUrl": "https://novelfull.com",
  "apiUrl": "",
  "iconUrl": "https://novelfull.com/favicon.ico",
  "typeSource": "single",
  "itemType": 2, // Novel type
  "version": "1.0.2", // Incremented for changes
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "novel/src/en/novelfull.js",
  "isNsfw": false,
  "hasCloudflare": true
}];

class DefaultExtension extends MProvider {
  mangaListFromPage(res, isSearch = false) {
    try {
      console.log("Response body (first 500 chars):", res.body.substring(0, 500));
      const doc = new Document(res.body);
      const novels = [];

      // Try primary selector, fallback to alternatives
      let elements = doc.select(".list-truyen .row");
      if (elements.length === 0) {
        elements = doc.select(".novel-list .item, .list-novel .row, .col-truyen-main .row"); // Fallback selectors
        console.log("Using fallback selectors, found elements:", elements.length);
      } else {
        console.log("Found novel elements with .list-truyen .row:", elements.length);
      }

      for (const el of elements) {
        const nameEl = el.selectFirst("h3.truyen-title > a, .novel-title a, .title a");
        const name = nameEl?.text?.trim();
        const link = nameEl?.getHref();

        const imageEl = el.selectFirst("img");
        let imageUrl = imageEl?.getAttribute("data-src") || imageEl?.getSrc() || "";
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
      return this.mangaListFromPage(res, true); // Pass isSearch flag
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

      const imageUrl = doc.selectFirst(".book img, .novel-cover img")?.getSrc() || "";
      const description = doc.selectFirst(".desc-text, .desc, .novel-description")?.text?.trim() || "";
      const author = doc.selectFirst("a[property='author'], .author a")?.text?.trim() || "";
      const genre = doc.select("a[itemprop='genre'], .genre a").map((el) => el.text?.trim()).filter(g => g);
      const statusText = doc.selectFirst(".info > div, .status")?.text?.toLowerCase() || "";
      const status = statusText.includes("ongoing") ? 0 : statusText.includes("completed") ? 1 : 2;
      console.log("Detail parsed:", { imageUrl, description, author, genre, status });

      const novelId = doc.selectFirst("#rating")?.getAttribute("data-novel-id");
      const chapters = [];

      if (novelId) {
        try {
          const chapterRes = await client.post("https://novelfull.com/ajax/chapter-archive", {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Referer": url,
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            },
            body: `novelId=${novelId}`
          });
          console.log("Chapter request status:", chapterRes.status);
          const chapterDoc = new Document(chapterRes.body);
          const chapterElements = chapterDoc.select("ul.list-chapter > li > a");
          console.log("Found chapters:", chapterElements.length);

          for (const el of chapterElements) {
            const name = el.text?.trim();
            const link = el.getHref();
            if (name && link) {
              chapters.push({
                name,
                url: `https://novelfull.com${link}`,
                dateUpload: null,
                scanlator: null
              });
            }
          }
        } catch (chapterError) {
          console.error("Error fetching chapters:", chapterError);
        }
      }

      return {
        imageUrl,
        description,
        genre,
        author,
        artist: "",
        status,
        chapters: chapters.reverse()
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