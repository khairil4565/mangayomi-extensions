const mangayomiSources = [{
  "name": "Novelfull",
  "lang": "en",
  "baseUrl": "https://novelfull.com",
  "apiUrl": "",
  "iconUrl": "https://novelfull.com/favicon.ico",
  "typeSource": "single",
  "itemType": 2, // Novel type
  "version": "1.0.9", // Incremented to force reload
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "novel/src/en/novelfull.js", // Verify this path
  "isNsfw": false,
  "hasCloudflare": true
}];

class DefaultExtension extends MProvider {
  getHeaders(url) {
    console.log("getHeaders: Called for URL:", url);
    return {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Referer": url || "https://novelfull.com",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5"
    };
  }

  mangaListFromPage(res) {
    console.log("--- DEBUG: mangaListFromPage (Version 1.0.9) ---");
    console.log("HTTP Response Status:", res.status);
    console.log("Response Body Length:", res.body.length);
    console.log("Response Body (first 1000 chars):", res.body.substring(0, 1000));

    if (res.body.includes("Just a moment") || res.body.includes("Enable JavaScript and cookies to continue")) {
      console.error("Cloudflare challenge detected in mangaListFromPage!");
      return { list: [], hasNextPage: false };
    }

    try {
      const doc = new Document(res.body);
      const novels = [];

      // Try multiple selectors for novel items
      let elements = doc.select(".list-truyen .row, .novel-list .item, .col-truyen-main .row, .novel-grid .novel-item, .list-novel .novel-item");
      console.log("Found novel elements:", elements.length);

      if (elements.length === 0) {
        console.warn("No novel elements found. Possible HTML structure change.");
        // Log all divs with potential novel items for debugging
        const allDivs = doc.select("div[class*='novel'], div[class*='list'], div[class*='item']");
        console.log("Alternative divs found:", allDivs.length);
        allDivs.forEach((div, i) => console.log(`Div ${i}:`, div.outerHtml.substring(0, 200)));
      }

      for (const el of elements) {
        let name = "";
        let link = "";
        let imageUrl = "";

        const nameEl = el.selectFirst("h3.truyen-title > a, .novel-title a, .title a, a.text-filter, a[href*='/novel/']");
        if (nameEl) {
          name = nameEl.text?.trim() || "";
          link = typeof nameEl.getHref === "function" ? nameEl.getHref() : nameEl.getAttribute("href") || "";
          console.log("Name and Link:", { name, link });
        }

        const imageEl = el.selectFirst("img, .cover img, .novel-cover img, .thumbnail img");
        if (imageEl) {
          imageUrl = imageEl.getSrc?.() || imageEl.getAttribute("data-src") || imageEl.getAttribute("src") || imageEl.getAttribute("srcset") || "";
          console.log("Raw imageUrl:", imageUrl);
        }

        if (imageUrl && imageUrl.startsWith("/")) {
          imageUrl = `https://novelfull.com${imageUrl}`;
        }
        if (link && !link.startsWith("http")) {
          link = `https://novelfull.com${link}`;
        }

        console.log(`Parsed Item: Name='${name}', Link='${link}', ImageURL='${imageUrl}'`);

        if (name && link) {
          novels.push({ name, link, imageUrl });
        } else {
          console.warn("Skipping item due to missing name or link:", el.outerHtml.substring(0, 200));
        }
      }

      const hasNextPage = doc.selectFirst("ul.pagination > li.active + li, .pagination .next, .next-page, a.next") !== null;
      console.log("Has next page:", hasNextPage);
      console.log("Total novels found:", novels.length);
      console.log("--- End mangaListFromPage ---");
      return { list: novels, hasNextPage };
    } catch (error) {
      console.error("mangaListFromPage: Error:", error);
      return { list: [], hasNextPage: false };
    }
  }

  toStatus(statusText) {
    statusText = statusText.toLowerCase();
    if (statusText.includes("ongoing")) return 0;
    if (statusText.includes("completed")) return 1;
    if (statusText.includes("hiatus")) return 2;
    if (statusText.includes("dropped")) return 3;
    return 5; // Unknown
  }

  async getPopular(page) {
    console.log("--- DEBUG: getPopular (Version 1.0.9) ---");
    try {
      const url = `https://novelfull.com/most-popular?page=${page}`;
      console.log("Requesting URL:", url);
      const res = await new Client().get(url, { headers: this.getHeaders(url) });
      console.log("HTTP Status:", res.status);
      if (res.body.includes("Just a moment") || res.body.includes("Enable JavaScript and cookies to continue")) {
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
    console.log("--- DEBUG: getLatestUpdates (Version 1.0.9) ---");
    try {
      const url = `https://novelfull.com/latest-release?page=${page}`;
      console.log("Requesting URL:", url);
      const res = await new Client().get(url, { headers: this.getHeaders(url) });
      console.log("HTTP Status:", res.status);
      if (res.body.includes("Just a moment") || res.body.includes("Enable JavaScript and cookies to continue")) {
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
    console.log("--- DEBUG: search (Version 1.0.9) ---");
    try {
      const url = `https://novelfull.com/search?keyword=${encodeURIComponent(query)}&page=${page}`;
      console.log("Requesting URL:", url);
      const res = await new Client().get(url, { headers: this.getHeaders(url) });
      console.log("HTTP Status:", res.status);
      if (res.body.includes("Just a moment") || res.body.includes("Enable JavaScript and cookies to continue")) {
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
    console.log("--- DEBUG: getDetail (Version 1.0.9) ---");
    try {
      console.log("Requesting URL:", url);
      const client = new Client();
      const res = await client.get(url, { headers: this.getHeaders(url) });
      console.log("HTTP Status:", res.status);
      if (res.body.includes("Just a moment") || res.body.includes("Enable JavaScript and cookies to continue")) {
        console.error("Cloudflare challenge detected in getDetail!");
        return {
          imageUrl: "", description: "", genre: [], author: "", artist: "", status: 5, chapters: []
        };
      }
      const doc = new Document(res.body);

      let imageUrl = "";
      const imageEl = doc.selectFirst(".book img, .novel-cover img, .cover-image img, .info img, .thumbnail img");
      if (imageEl) {
        imageUrl = imageEl.getSrc?.() || imageEl.getAttribute("data-src") || imageEl.getAttribute("src") || imageEl.getAttribute("srcset") || "";
        console.log("Raw imageUrl:", imageUrl);
      }
      if (imageUrl && imageUrl.startsWith("/")) {
        imageUrl = `https://novelfull.com${imageUrl}`;
      }
      console.log("getDetail: imageUrl:", imageUrl);

      const description = doc.selectFirst(".desc-text, .desc, .novel-description, .summary")?.text?.trim() || "";
      const author = doc.selectFirst("a[property='author'], .author a, .info a, .author-name")?.text?.trim() || "";
      const artist = "";
      const statusText = doc.selectFirst(".info > div, .status, .info-meta, .status-text")?.text?.toLowerCase() || "";
      const status = this.toStatus(statusText);
      const genre = doc.select("a[itemprop='genre'], .genre a, .category a, .tags a").map((el) => el.text?.trim()).filter(g => g);

      const chapters = [];
      const chapterElements = doc.select(".list-chapter > li, .chapter-list li, ul.chapters li");
      console.log("Found chapters:", chapterElements.length);
      for (const el of chapterElements) {
        const nameEl = el.selectFirst("a");
        let name = "";
        let link = "";
        if (nameEl) {
          name = nameEl.text?.trim() || "";
          link = nameEl.getHref?.() || nameEl.getAttribute("href") || "";
          console.log("Chapter:", { name, link });
        }
        if (name && link) {
          chapters.push({
            name,
            url: link.startsWith("http") ? link : `https://novelfull.com${link}`,
            dateUpload: null,
            scanlator: null
          });
        }
      }

      console.log("getDetail: Parsed:", { imageUrl, description, author, genre, status, chapterCount: chapters.length });
      return {
        imageUrl,
        description,
        genre,
        author,
        artist,
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
        status: 5,
        chapters: []
      };
    }
  }

  async getHtmlContent(name, url) {
    console.log("--- DEBUG: getHtmlContent (Version 1.0.9) ---");
    try {
      console.log("Requesting URL:", url);
      const res = await new Client().get(url, { headers: this.getHeaders(url) });
      console.log("HTTP Status:", res.status);
      if (res.body.includes("Just a moment") || res.body.includes("Enable JavaScript and cookies to continue")) {
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
    console.log("--- DEBUG: cleanHtmlContent (Version 1.0.9) ---");
    try {
      const doc = new Document(html);
      const title = doc.selectFirst("h2, .chapter-title, h3, .title")?.text?.trim() || "";
      const content = doc.selectFirst(".chapter-c, .chapter-content, .content, .text")?.innerHtml || "";
      console.log("cleanHtmlContent: Title:", title);
      return `<h2>${title}</h2><hr><br>${content}`;
    } catch (error) {
      console.error("cleanHtmlContent: Error:", error);
      return "";
    }
  }

  getFilterList() {
    console.log("--- DEBUG: getFilterList (Version 1.0.9) ---");
    return [];
  }

  getSourcePreferences() {
    console.log("--- DEBUG: getSourcePreferences (Version 1.0.9) ---");
    return {};
  }

  parseDate(date) {
    console.log("--- DEBUG: parseDate (Version 1.0.9) ---");
    const months = {
      "january": "01", "february": "02", "march": "03", "april": "04", "may": "05", "june": "06",
      "july": "07", "august": "08", "september": "09", "october": "10", "november": "11", "december": "12"
    };
    date = date.toLowerCase().replace(",", "").split(" ");
    if (!(date[0] in months)) {
      console.warn("parseDate: Invalid month, returning current timestamp");
      return String(new Date().valueOf());
    }
    date[0] = months[date[0]];
    date = [date[2], date[0], date[1]].join("-");
    console.log("parseDate: Parsed date:", date);
    return String(new Date(date).valueOf());
  }
}