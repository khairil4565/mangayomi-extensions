const mangayomiSources = [{
  "name": "Novelfull",
  "lang": "en",
  "baseUrl": "https://novelfull.com",
  "apiUrl": "",
  "iconUrl": "https://novelfull.com/favicon.ico",
  "typeSource": "single",
  "itemType": 2, // Novel type
  "version": "1.0.1", // Incremented version for changes
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "novel/src/en/novelfull.js",
  "isNsfw": false,
  "hasCloudflare": true
}];

class DefaultExtension extends MProvider {
  mangaListFromPage(res) {
    try {
      console.log("Raw response body:", res.body.substring(0, 500)); // Log first 500 chars of HTML
      const doc = new Document(res.body);
      const novels = [];
      const elements = doc.select(".list-truyen .row"); // Verify this selector
      console.log("Found novel elements:", elements.length);

      for (const el of elements) {
        const nameEl = el.selectFirst("h3.truyen-title > a");
        const name = nameEl?.text?.trim();
        const link = nameEl?.getHref();

        const imageEl = el.selectFirst("img");
        let imageUrl = imageEl?.getAttribute("data-src") || imageEl?.getSrc() || "";
        if (imageUrl && imageUrl.startsWith("/")) {
          imageUrl = `https://novelfull.com${imageUrl}`;
        }
        console.log("Novel:", { name, link, imageUrl }); // Log each novel

        if (name && link) {
          novels.push({ name, link: `https://novelfull.com${link}`, imageUrl });
        }
      }

      const hasNextPage = doc.selectFirst("ul.pagination > li.active + li") !== null;
      console.log("Has next page:", hasNextPage);
      return { list: novels, hasNextPage };
    } catch (error) {
      console.error("Error in mangaListFromPage:", error);
      return { list: [], hasNextPage: false };
    }
  }

  async getPopular(page) {
    try {
      const res = await new Client().get(`https://novelfull.com/most-popular?page=${page}`);
      console.log("getPopular status:", res.status);
      return this.mangaListFromPage(res);
    } catch (error) {
      console.error("Error in getPopular:", error);
      return { list: [], hasNextPage: false };
    }
  }

  async getLatestUpdates(page) {
    try {
      const res = await new Client().get(`https://novelfull.com/latest-release?page=${page}`);
      console.log("getLatestUpdates status:", res.status);
      return this.mangaListFromPage(res);
    } catch (error) {
      console.error("Error in getLatestUpdates:", error);
      return { list: [], hasNextPage: false };
    }
  }

  async search(query, page, filters) {
    try {
      const res = await new Client().get(`https://novelfull.com/search?keyword=${encodeURIComponent(query)}&page=${page}`);
      console.log("Search status:", res.status);
      return this.mangaListFromPage(res); // Consider separate parsing logic if search page differs
    } catch (error) {
      console.error("Error in search:", error);
      return { list: [], hasNextPage: false };
    }
  }

  async getDetail(url) {
    try {
      const client = new Client();
      const res = await client.get(url);
      console.log("getDetail status:", res.status);
      const doc = new Document(res.body);

      const imageUrl = doc.selectFirst(".book img")?.getSrc() || "";
      const description = doc.selectFirst(".desc-text")?.text?.trim() || "";
      const author = doc.selectFirst("a[property='author']")?.text?.trim() || "";
      const genre = doc.select("a[itemprop='genre']").map((el) => el.text?.trim()).filter(g => g);
      const statusText = doc.selectFirst(".info > div")?.text?.toLowerCase() || "";
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
      const res = await new Client().get(url);
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
      const title = doc.selectFirst("h2")?.text?.trim() || "";
      const content = doc.selectFirst(".chapter-c")?.innerHtml || "";
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