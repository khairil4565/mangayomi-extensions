const mangayomiSources = [{
  "name": "Novelfull",
  "lang": "en",
  "baseUrl": "https://novelfull.com",
  "apiUrl": "",
  "iconUrl": "https://novelfull.com/favicon.ico",
  "typeSource": "single",
  "itemType": 2,
  "version": "1.0.0",
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "novel/src/en/novelfull.js",
  "isNsfw": false,
  "hasCloudflare": true
}];

class DefaultExtension extends MProvider {
  mangaListFromPage(res) {
    const doc = new Document(res.body);
    const novels = [];
    const elements = doc.select(".list-truyen .row");
    for (const el of elements) {
      const name = el.selectFirst("h3.truyen-title > a")?.text.trim();
      const link = el.selectFirst("h3.truyen-title > a")?.getHref;
      const imageUrl = el.selectFirst("img")?.getSrc;
      if (name && link) {
        novels.push({ name, link: "https://novelfull.com" + link, imageUrl });
      }
    }
    const hasNextPage = doc.selectFirst("ul.pagination > li.active + li") !== null;
    return { list: novels, hasNextPage };
  }

  async getPopular(page) {
    const res = await new Client().get(`https://novelfull.com/most-popular?page=${page}`);
    return this.mangaListFromPage(res);
  }

  async getLatestUpdates(page) {
    const res = await new Client().get(`https://novelfull.com/latest-release?page=${page}`);
    return this.mangaListFromPage(res);
  }

  async search(query, page, filters) {
    const res = await new Client().get(`https://novelfull.com/search?keyword=${encodeURIComponent(query)}&page=${page}`);
    return this.mangaListFromPage(res);
  }

  async getDetail(url) {
    const client = new Client();
    const res = await client.get(url);
    const doc = new Document(res.body);
    const imageUrl = doc.selectFirst(".book img")?.getSrc;
    const description = doc.selectFirst(".desc-text")?.text.trim();
    const author = doc.selectFirst("a[property='author']")?.text.trim();
    const genre = doc.select("a[itemprop='genre']").map((el) => el.text.trim());
    const statusText = doc.selectFirst(".info > div")?.text.toLowerCase();
    const status = statusText?.includes("ongoing") ? 0 : statusText?.includes("completed") ? 1 : 2;

    const chapters = [];
    const chapterDoc = new Document(res.body);
    const chapterElements = chapterDoc.select(".list-chapter > li");
    for (const el of chapterElements) {
      const name = el.selectFirst("a")?.text.trim();
      const link = el.selectFirst("a")?.getHref;
      chapters.push({
        name,
        url: "https://novelfull.com" + link,
        dateUpload: null,
        scanlator: null
      });
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
    const res = await new Client().get(url);
    return this.cleanHtmlContent(res.body);
  }

  async cleanHtmlContent(html) {
    const doc = new Document(html);
    const title = doc.selectFirst("h2")?.text.trim() || "";
    const content = doc.selectFirst(".chapter-c")?.innerHtml;
    return `<h2>${title}</h2><hr><br>${content}`;
  }

  getFilterList() {
    return [];
  }

  getSourcePreferences() {
    return {};
  }
}
