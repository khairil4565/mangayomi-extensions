const mangayomiSources = [{
  "name": "ReadNovelFull",
  "lang": "en",
  "baseUrl": "https://readnovelfull.com",
  "apiUrl": "",
  "iconUrl": "https://readnovelfull.com/favicon.ico",
  "typeSource": "single",
  "itemType": 2,
  "version": "1.0.0",
  "dateFormat": "",
  "dateFormatLocale": "",
  "pkgPath": "novel/src/en/readnovelfull.js",
  "isNsfw": false,
  "hasCloudflare": true
}];

class DefaultExtension extends MProvider {
  mangaListFromPage(res) {
    const doc = new Document(res.body);
    const novels = [];
    const elements = doc.select("div.list-novel .row");

    for (const el of elements) {
      const name = el.selectFirst("h3.novel-title > a")?.text.trim();
      const link = el.selectFirst("h3.novel-title > a")?.getHref();
      let imageUrl = el.selectFirst("img")?.getAttribute("data-src") || el.selectFirst("img")?.getSrc();

      if (link && name) {
        novels.push({
          name,
          link: "https://readnovelfull.com" + link,
          imageUrl: imageUrl?.startsWith("http") ? imageUrl : "https://readnovelfull.com" + imageUrl
        });
      }
    }

    const hasNextPage = doc.selectFirst(".pagination > li.active + li") !== null;
    return { list: novels, hasNextPage };
  }

  async getPopular(page) {
    const res = await new Client().get(`https://readnovelfull.com/novel-list/most-popular-novel?page=${page}`);
    return this.mangaListFromPage(res);
  }

  async getLatestUpdates(page) {
    const res = await new Client().get(`https://readnovelfull.com/novel-list/latest-release-novel?page=${page}`);
    return this.mangaListFromPage(res);
  }

  async search(query, page, filters) {
    const res = await new Client().get(`https://readnovelfull.com/novel-list/search?keyword=${encodeURIComponent(query)}&page=${page}`);
    return this.mangaListFromPage(res);
  }

  async getDetail(url) {
    const client = new Client();
    const res = await client.get(url);
    const doc = new Document(res.body);

    const imageUrl = doc.selectFirst(".book img")?.getSrc();
    const description = doc.selectFirst(".desc-text")?.text.trim();
    const author = doc.selectFirst("a[property='author']")?.text.trim();
    const genre = doc.select("a[itemprop='genre']").map((el) => el.text.trim());
    const statusText = doc.selectFirst(".info > div")?.text.toLowerCase();
    const status = statusText?.includes("ongoing") ? 0 : statusText?.includes("completed") ? 1 : 2;

    const chapters = [];
    const chapterElements = doc.select("#tab-chapters .list-chapter > li > a");
    for (const el of chapterElements.reverse()) {
      const name = el.text.trim();
      const link = el.getHref();
      chapters.push({
        name,
        url: "https://readnovelfull.com" + link,
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
