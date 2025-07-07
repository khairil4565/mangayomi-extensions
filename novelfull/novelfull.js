const mangayomiSources = [{
  "name": "Novelfull",
  "lang": "en",
  "baseUrl": "https://novelfull.com",
  "apiUrl": "",
  "iconUrl": "https://novelfull.com/favicon.ico",
  "typeSource": "single",
  "itemType": 2, // Novel type
  "version": "1.0.0",
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "novel/src/en/novelfull.js",
  "isNsfw": false,
  "hasCloudflare": true
}];

class DefaultExtension extends MProvider {
  mangaListFromPage(res) {
    try {
      const doc = new Document(res.body);
      const novels = [];
      const elements = doc.select(".list-truyen .row");

      for (const el of elements) {
        const name = el.selectFirst("h3.truyen-title > a")?.text?.trim();
        const link = el.selectFirst("h3.truyen-title > a")?.getHref();

        const imageEl = el.selectFirst("img");
        let imageUrl = imageEl?.getAttribute("data-src") || imageEl?.getSrc() || "";
        if (imageUrl && imageUrl.startsWith("/")) {
          imageUrl = `https://novelfull.com${imageUrl}`;
        }

        if (name && link) {
          novels.push({ name, link: `https://novelfull.com${link}`, imageUrl });
        }
      }

      const hasNextPage = doc.selectFirst("ul.pagination > li.active + li") !== null;
      return { list: novels, hasNextPage };
    } catch (error) {
      console.error("Error in mangaListFromPage:", error);
      return { list: [], hasNextPage: false };
    }
  }

  async getPopular(page) {
    try {
      const res = await new Client().get(`https://novelfull.com/most-popular?page=${page}`);
      return this.mangaListFromPage(res);
    } catch (error) {
      console.error("Error in getPopular:", error);
      return { list: [], hasNextPage: false };
    }
  }

  async getLatestUpdates(page) {
    try {
      const res = await new Client().get(`https://novelfull.com/latest-release?page=${page}`);
      return this.mangaListFromPage(res);
    } catch (error) {
      console.error("Error in getLatestUpdates:", error);
      return { list: [], hasNextPage: false };
    }
  }

  async search(query, page, filters) {
    try {
      const res = await new Client().get(`https://novelfull.com/search?keyword=${encodeURIComponent(query)}&page=${page}`);
      return this.mangaListFromPage(res);
    } catch (error) {
      console.error("Error in search:", error);
      return { list: [], hasNextPage: false };
    }
  }

  async getDetail(url) {
    try {
      const client = new Client();
      const res = await client.get(url);
      const doc = new Document(res.body);

      const imageUrl = doc.selectFirst(".book img")?.getSrc() || "";
      const description = doc.selectFirst(".desc-text")?.text?.trim() || "";
      const author = doc.selectFirst("a[property='author']")?.text?.trim() || "";
      const genre = doc.select("a[itemprop='genre']").map((el) => el.text?.trim()).filter(g => g);
      const statusText = doc.selectFirst(".info > div")?.text?.toLowerCase() || "";
      const status = statusText.includes("ongoing") ? 0 : statusText.includes("completed") ? 1 : 2;

      const novelId = doc.selectFirst("#rating")?.getAttribute("data-novel-id");
      const chapters = [];

      if (novelId) {
        try {
          const chapterRes = await client.post("https://novelfull.com/ajax/chapter-archive", {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Referer": url,
            },
            body: `novelId=${novelId}`
          });

          const chapterDoc = new Document(chapterRes.body);
          const chapterElements = chapterDoc.select("ul.list-chapter > li > a");
          for (const el of chapterElements) {
            const name = el.text?.trim();
            const link = el.getHref();
            if (name && link) {
              chapters.push({
                name,
                url: `https://novelfull.com${link}`,
                dateUpload: null, // Consider extracting if available
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
      const res = await new Client().get(url);
      return this.cleanHtmlContent(res.body);
    } catch (error) {
      console.error("Error in getHtmlContent:", error);
      return "";
    }
  }

  async cleanHtmlContent(html) {
    try {
      const doc = new Document(html);
      const title = doc.selectFirst("h2")?.text?.trim() || "";
      const content = doc.selectFirst(".chapter-c")?.innerHtml || "";
      return `<h2>${title}</h2><hr><br>${content}`;
    } catch (error) {
      console.error("Error in cleanHtmlContent:", error);
      return "";
    }
  }

  getFilterList() {
    // Add filters if Novelfull supports them (e.g., genres)
    return [];
  }

  getSourcePreferences() {
    return {};
  }
}